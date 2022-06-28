import { Component, ChangeDetectionStrategy, Input, OnInit, ViewChildren, OnChanges, SimpleChanges } from '@angular/core';
import { environment } from '@environments/environment';
import { HttpClient } from '@angular/common/http';
import { catchError } from "rxjs/operators";
import { NotificationService } from '@core/notifications/notification.service';
import { AnalysesService } from '@app/features/analysis/services/analysis.service';
import * as d3 from 'd3';
import { MatDialog } from '@angular/material/dialog';
import { AddSampleSetComponent } from '../dialogs/add-sample-set/add-sample-set.component';
import { MetadataService } from '@app/core/metadata/metadata.service';
import { CustomSetType, CustomSet } from '@app/_models/metadata';

@Component({
    selector: 'mev-decontx',
    templateUrl: './decontx.component.html',
    styleUrls: ['./decontx.component.css'],
    changeDetection: ChangeDetectionStrategy.Default
})

export class DecontxComponent implements OnInit {
    @Input() outputs;
    private readonly API_URL = environment.apiUrl;
    decontxClass = {};
    decontxIds = {};
    toggleValue: string = "log10";
    selectedSamples = [];
    clusterType: string = '';
    checkedObj = {};
    isLoading = true;
    selectedSamplesNames = [];
    displayNames = [];
    windowWidth;
    customObservationSets;

    constructor(
        private httpClient: HttpClient,
        private readonly notificationService: NotificationService,
        private apiService: AnalysesService,
        public dialog: MatDialog,
        private metadataService: MetadataService,
    ) { }

    ngOnInit(): void {
        this.windowWidth = window.innerWidth
        let decontxID = this.outputs["decontaminate_output"];
        this.apiService
            .getResourceContent(decontxID)
            .subscribe(async res => {
                console.log("res: ", res)
                for (let i = 0; i < res.length; i++) {
                    let currentClass = res[i]['values']['decontx_class'];
                    let currentContaminationNumber = res[i]['values']['decontx_contamination'];
                    let currentId = res[i]['rowname']
                    let newName = currentClass;
                    if (this.decontxClass[newName] === undefined) {
                        this.decontxClass[newName] = []
                        this.decontxIds[newName] = []
                    }

                    this.decontxClass[newName].push(currentContaminationNumber);
                    this.decontxIds[newName].push(currentId)
                }
                for (let item in this.decontxClass) {
                    this.checkedObj[item] = false;
                    this.createHistogram(item);
                }
                await new Promise(resolve => setTimeout(resolve, 1)); // 0.001 sec
                this.changeYAxis('log10')
                this.isLoading = false
            },
                error => {
                    console.log("Error: ", error);
                    let message = `Error: ${error.error.error}`
                    this.notificationService.warn(message);
                    throw error;
                }

            );
    }

    createHistogram(group) {
        let data = this.decontxClass[group];
        let location = 'histogram' + group;
        d3.select(`#${location}`)
            .selectAll('svg')
            .remove()
            .exit()

        // set the dimensions and margins of the graph
        let margin = { top: 10, right: 80, bottom: 80, left: 100 },
            width = 500 - margin.left - margin.right,
            height = 200 - margin.top - margin.bottom;

        // append the svg object to the body of the page
        let svg = d3.select(`#${location}`)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        // X axis: scale and draw:
        let x = d3.scaleLinear()    // can use this instead of 1000 to have the max of data: d3.max(data, function(d) { return +d.price })
            .domain([0, 1])
            .range([0, width]);
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));

        svg
            .append('text')
            .classed('label', true)
            .attr('x', width / 1.25)
            .attr('y', height + margin.bottom * .5)
            .style('text-anchor', 'end')
            .style('font-size', '12px')
            .text("Estimated Contamination ( % )");

        // set the parameters for the histogram
        let histogram = d3.histogram()
            .value(function (d) { return d; })   // I need to give the vector of value
            .domain(x.domain())  // then the domain of the graphic
            .thresholds(x.ticks(60)); // then the numbers of bins

        // And apply this function to data to get the bins
        let bins = histogram(data);

        if (this.toggleValue === "log10") {
            // Y axis: scale and draw:
            let y = d3.scaleLinear()
                .range([height, 1]);
            y.domain([0, Math.log10(d3.max(bins, function (d) { return d.length; })) * 1.25]);   // d3.hist has to be called before the Y axis obviously
            svg.append("g")
                .call(d3.axisLeft(y).ticks(6))

            svg
                .append('text')
                .classed('label', true)
                .attr('transform', 'rotate(-90)')
                .attr('y', -margin.left / 2 + 2)
                .attr('x', -height / 2)
                .attr('dy', '.71em')
                .style('text-anchor', 'middle')
                .style('font-size', '12px')
                .text("Log10 ( Count + 0.1 )");

            svg.selectAll("rect")
                .data(bins)
                .enter()
                .append("rect")
                .attr("x", 1)
                .attr("transform", d => {
                    let logValue = (d.length === 0) ? 0 : Math.log10(d.length + .1)
                    return "translate(" + x(d.x0) + "," + y(logValue) + ")";
                })
                .attr("width", function (d) { return Math.abs(x(d.x1) - x(d.x0) - 1); })
                .attr("height", function (d) {
                    let logValue = (d.length === 0) ? 0 : Math.log10(d.length + .1)
                    return height - y(logValue);
                })
                .style("fill", "#69b3a2")
                .style("opacity", .6)
        } else {
            // Y axis: scale and draw:
            let y = d3.scaleLinear()
                .range([height, 1]);
            y.domain([0, (d3.max(bins, function (d) { return d.length; })) * 1.25]);
            svg.append("g")
                .call(d3.axisLeft(y).ticks(6)) //for frequency Y scale

            svg
                .append('text')
                .classed('label', true)
                .attr('transform', 'rotate(-90)')
                .attr('y', -margin.left / 2 + 2)
                .attr('x', -height / 2)
                .attr('dy', '.71em')
                .style('text-anchor', 'middle')
                .style('font-size', '12px')
                .text("Counts");

            svg.selectAll("rect")
                .data(bins)
                .enter()
                .append("rect")
                .attr("x", 1)
                .attr("transform", d => {
                    return "translate(" + x(d.x0) + "," + y(d.length) + ")";
                })
                .attr("width", function (d) { return Math.abs(x(d.x1) - x(d.x0) - 1); })
                .attr("height", function (d) {
                    return height - y(d.length);
                })
                .style("fill", "#69b3a2")
                .style("opacity", .6)
        }
    }

    changeYAxis(value) {
        this.toggleValue = value;
        for (let item in this.decontxClass) {
            this.createHistogram(item)
        }
    }

    onCreateCustomSampleSet() {
        let samples = this.selectedSamples.map(elem => ({ id: elem }));
        const dialogRef = this.dialog.open(AddSampleSetComponent, {
            data: { type: CustomSetType.ObservationSet }
        });

        dialogRef.afterClosed().subscribe(customSetData => {
            if (customSetData) {
                const observationSet: CustomSet = {
                    name: customSetData.name,
                    type: CustomSetType.ObservationSet,
                    color: customSetData.color,
                    elements: samples,
                    multiple: true
                };

                if (this.metadataService.addCustomSet(observationSet)) {
                    this.customObservationSets = this.metadataService.getCustomObservationSets();
                }
            }
        });
    }

    onAddToSampleSet(button) {
        if (this.checkedObj[button] === false) {
            this.selectedSamplesNames.push(button)
            let temp = "Group " + button;
            this.displayNames.push(temp)
        } else {
            this.selectedSamplesNames = this.selectedSamplesNames.filter(name => name !== button)
            let temp = "Group " + button;
            this.displayNames = this.displayNames.filter(name => name !== temp)
        }
        this.selectedSamples = [];
        for (let i = 1; i < this.selectedSamplesNames.length + 1; i++) {
            this.selectedSamples = this.selectedSamples.concat(this.decontxIds[i])
        }
    }
}