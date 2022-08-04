import { Component, ChangeDetectionStrategy, Input, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { NotificationService } from '@core/notifications/notification.service';
import { AnalysesService } from '@app/features/analysis/services/analysis.service';
import * as d3 from 'd3';
import d3Tip from 'd3-tip';

import { catchError } from 'rxjs/operators';

@Component({
    selector: 'mev-lioness',
    templateUrl: './lioness.component.html',
    styleUrls: ['./lioness.component.scss'],
    changeDetection: ChangeDetectionStrategy.Default
})
export class LionComponent implements OnInit {
    @Input() outputs;
    isLoading: boolean = false;
    lionessData = [];
    xAxisArr = [];
    yAxisArr = [];
    min = 100000;
    max = 0;
    logMin = 0;
    logMax = 1;
    realOffset = 0;
    logScale = true;
    windowWidth = 1000;
    windowHeight = 1000;
    radioButtonList = [
        {
            name: "Genes"
        },
        {
            name: "Transcription Factor"
        }
    ];
    resourceType = "Transcription Factor";
    radioButtonListAxis = [
        {
            name: "X-Axis"
        },
        {
            name: "Y-Axis"
        }
    ];
    resourceTypeAxis = "X-Axis";
    precision = 2;
    tooltipOffsetX = 10;
    isGene = false;
    useXAxis = true;

    private readonly API_URL = environment.apiUrl;

    constructor(
        private httpClient: HttpClient,
        private readonly notificationService: NotificationService,
        private analysesService: AnalysesService,
    ) { }

    ngOnInit(): void {
        this.windowWidth = window.innerWidth;
        this.windowHeight = window.innerHeight;
        this.getData()
    }

    getData() {
        this.isLoading = true;
        let uuid_gene = '971af5e3-e567-42ff-b20d-a38f6fb44e0b';
        let uuid_tf = 'cc67929c-cafb-456d-b009-c013a3f4d655';
        let uuid = this.resourceType === "Genes" ? uuid_gene : uuid_tf;
        this.analysesService
            .getResourceContent(uuid)
            .subscribe(data => {
                this.isLoading = false;
                console.log("data: ", data)
                this.xAxisArr = [];
                this.yAxisArr = [];
                if (this.useXAxis) {
                    for (let i = 0; i < 10; i++) {
                        this.xAxisArr.push(data[i].rowname)
                        let values = data[i].values
                        for (let item in values) {
                            if (data[i].values[item] < this.min) {
                                this.min = data[i].values[item];
                            }
                            if (data[i].values[item] > this.max) {
                                this.max = data[i].values[item];
                            }
                            if (!this.yAxisArr.includes(item)) {
                                this.yAxisArr.push(item)
                            }


                            let temp = {
                                xValue: data[i].rowname,
                                yValue: item,
                                value: data[i].values[item]
                            }
                            this.lionessData.push(temp);

                        }
                    }
                } else {
                    for (let i = 0; i < 10; i++) {
                        this.yAxisArr.push(data[i].rowname)
                        let values = data[i].values
                        for (let item in values) {
                            if (data[i].values[item] < this.min) {
                                this.min = data[i].values[item];
                            }
                            if (data[i].values[item] > this.max) {
                                this.max = data[i].values[item];
                            }
                            if (!this.xAxisArr.includes(item)) {
                                this.xAxisArr.push(item)
                            }


                            let temp = {
                                yValue: data[i].rowname,
                                xValue: item,
                                value: data[i].values[item]
                            }
                            this.lionessData.push(temp);

                        }
                    }
                }
                console.log("lion data: ", this.lionessData)

                this.createHeatmap();

            });
    }

    createHeatmap() {
        // set the dimensions and margins of the graph
        const margin = { top: 30, right: 30, bottom: 30, left: 30 },
            width = (this.windowWidth * .75) - margin.left - margin.right,
            height = this.windowHeight - margin.top - margin.bottom;

        // tool tip for individual points (if displayed)
        const pointTip = d3Tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html((event, d) => {
                let xAxisDescription = this.isGene ? 'Gene' : 'Transcription Factor';
                let tipBox = `<div><div class="category">${xAxisDescription}:</div> ${d.xValue}</div>
                <div><div class="category">Samples/Observations:</div> ${d.yValue}</div>
                <div><div class="category">Value: </div>${d.value}</div>`
                return tipBox
            });

        d3.select("#lioness")
            .selectAll('svg')
            .remove();

        // append the svg object to the body of the page
        const svg = d3.select("#lioness")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const tooltipOffsetX = this.tooltipOffsetX;
        svg.call(pointTip);

        // Labels of row and columns
        const xGroup = this.xAxisArr;
        const yGroup = this.yAxisArr;

        // Build X scales and axis:
        const x = d3.scaleBand()
            .range([0, width])
            .domain(xGroup)
            .padding(0.01);
        // svg.append("g")
        //     .attr("transform", `translate(0, ${height})`)
        //     .call(d3.axisBottom(x))

        // Build X scales and axis:
        const y = d3.scaleBand()
            .range([height, 0])
            .domain(yGroup)
            .padding(0.01);
        // svg.append("g")
        //     .call(d3.axisLeft(y));

        svg.append('text')
            .classed('label', true)
            .attr('transform', 'rotate(-90)')
            .attr('y', -margin.left + 10)
            .attr('x', -height / 2)
            .attr('dy', '.71em')
            .style('text-anchor', 'middle')
            .text(this.useXAxis ? "Samples/Observations" : `${this.resourceType}`);

        svg
            .append('text')
            .classed('label', true)
            .attr('x', width / 2)
            .attr('y', height + margin.bottom - 10)
            .style('text-anchor', 'end')
            .text(this.useXAxis ? `${this.resourceType}` : "Samples/Observations");

        // Build color scale
        const myColor = d3.scaleLinear()
            .range(["#1E90FF", "#EE204D"])
            .domain([this.min, this.max])

        //Read the data
        let data = this.lionessData
        svg.selectAll()
            .data(data, function (d) { return `${d.xValue}:${d.yValue}` })
            .join("rect")
            .attr("x", function (d) { return x(d.xValue) })
            .attr("y", function (d) { return y(d.yValue) })
            .attr("width", x.bandwidth())
            .attr("height", y.bandwidth())
            .style("fill", function (d) {
                return myColor(d.value)
            })
            .on('mouseover', function (mouseEvent: any, d) {
                pointTip.show(mouseEvent, d, this);
                pointTip.style('left', mouseEvent.x + tooltipOffsetX + 'px');
            })
            .on('mouseout', pointTip.hide);
    }

    onRadioChangeAxis(axis) {
        this.resourceType = axis;
        this.getData();
    }


    onRadioChangeAxis2(axis) {
        this.useXAxis = (axis === 'X-Axis') ? true : false;
        this.getData();
    }

}