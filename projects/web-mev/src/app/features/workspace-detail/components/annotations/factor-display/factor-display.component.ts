import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';

import * as d3 from 'd3';
import d3Tip from 'd3-tip';
import { MetadataService } from '@app/core/metadata/metadata.service';
import { CustomSet, CustomSetType } from '@app/_models/metadata';
import { Utils } from '@app/shared/utils/utils';

@Component({
  selector: 'factor-ann-display',
  templateUrl: './factor-display.component.html',
  styleUrls: ['./factor-display.component.scss']
})
export class FactorDisplayComponent implements OnInit {

    @Input() fieldName: string = '';
    @Input() data: any[] = [];

    form: FormGroup;
    binCounts;
    countMap;
    svg;
    barsGrp;
    xAxisLabelGrp;
    yAxisLabelGrp;
    xScale;
    yScale;
    bandwidth;
    maxY;
    containerId = '#factor-display-wrapper'
    offset = 40;
    width = 800;
    height = 400;
    innerHeight = this.height - this.offset;
    createObsSetBtnDisabled;

    dropdownSettings = {};
    allCategories = [];
    colorMap;

    constructor(private metadataService: MetadataService,
        private formBuilder: FormBuilder) { }

    ngOnInit(): void {

        this.form = this.formBuilder.group(
            {
                categories: ['']
            }
        );

        this.dropdownSettings = {
            primaryKey: 'name',
            text: 'Select custom observation sets to create',
            selectAllText: 'Select All',
            unSelectAllText: 'Unselect All',
            classes: 'resource-dropdown',
            tagToBody: false
        };
        this.createObsSetBtnDisabled = true;
        this.countBins();
        this.setupPlot();
        this.makeBarPlot();
    }

    /**
     * This is called any time there is a change in the
     *  selection box which allows selection of categories
     */
    onSelect(event: any) {
        let selectedCategories = this.form.controls['categories'].value;
        if (selectedCategories.length > 0) {
            this.createObsSetBtnDisabled = false;
        } else {
            this.createObsSetBtnDisabled = true;
        }
    }

    countBins() {
        this.countMap = new Map<string, string[]>();
        for (let x of this.data) {
            if (this.countMap.has(x.val)) {
                this.countMap.get(x.val).push(x.id);
            } else {
                this.countMap.set(x.val, [x.id]);
            }
        }
        this.binCounts = [];
        this.colorMap = new Map<string, string>();
        for (let [k, v] of this.countMap.entries()) {
            this.binCounts.push(
                {
                    key: k,
                    count: v.length
                }
            );
            this.allCategories.push({
                name: k
            })
            this.colorMap.set(k, Utils.getRandomColor());
        }
    }

    setupPlot() {
        this.svg = d3
            .select(this.containerId)
            .append('svg')
            .attr('width', outerWidth)
            .attr('height', outerHeight)
            .append('g')
            .attr(
                'transform',
                'translate(' + this.offset + ',' + this.offset + ')'
            )
            .style('fill', 'none');

        this.barsGrp = this.svg.append('g');
        this.xAxisLabelGrp = this.svg.append('g');
        this.yAxisLabelGrp = this.svg.append('g');

        this.maxY = d3.max(this.binCounts.map(d => d.count));
        let xCats = this.binCounts.map(d => d.key)
        this.xScale = d3.scaleBand()
            .domain(xCats)
            .range([this.offset, this.width - this.offset])
            .paddingOuter(0.1)
            .paddingInner(0.5);

        this.bandwidth = this.xScale.bandwidth();

        this.yScale = d3.scaleLinear()
            .domain([0, 1.1 * this.maxY])
            .range([this.innerHeight, 0]);

        this.xAxisLabelGrp
            .attr('transform', "translate(0," + (this.innerHeight) + ")")
            .call(d3.axisBottom(this.xScale));

        this.yAxisLabelGrp
            .attr('transform', "translate(" + this.offset + ",0)")
            .call(d3.axisLeft(this.yScale));
    }

    makeBarPlot() {

        const tip = d3Tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html((event, d) => {
                return (
                    '<span>' + d.key + ':' + d.count + '</span>'
                );
            });
        this.svg.call(tip);

        this.barsGrp
            .selectAll('rect')
            .data(this.binCounts)
            .enter()
            .append('rect')
            .attr('x', d => this.xScale(d.key))
            .attr('y', d => {
                return (this.yScale(d.count))
            })
            .attr('height', d => {
                return this.innerHeight - this.yScale(d.count);
            })
            .attr('width', this.bandwidth)
            .attr('fill', d => this.colorMap.get(d.key))
            .attr('pointer-events', 'all')
            .on('mouseover', tip.show)
            .on('mouseout', tip.hide);


    }

    saveObsSets() {

        let selectedCategories = this.form.controls['categories'].value;
        for (let categoryObj of selectedCategories) {
            let category = categoryObj.name;
            if (this.countMap.has(category)) {
                let items = this.countMap.get(category).map(x => {
                    return {
                        id: x
                    }
                });
                const observationSet: CustomSet = {
                    name: `${this.fieldName}:${category}`,
                    type: CustomSetType.ObservationSet,
                    color: this.colorMap.get(category),
                    elements: items
                };
                this.metadataService.addCustomSet(observationSet)
            }
        }
    }

}
