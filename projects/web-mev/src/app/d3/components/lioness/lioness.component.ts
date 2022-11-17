import { Component, ChangeDetectionStrategy, Input, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { NotificationService } from '@core/notifications/notification.service';
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
            name: "Transcription Factor"
        },
        {
            name: "Genes"
        },
    ];
    resourceType = "Transcription Factor";
    radioButtonListAxis = [
        {
            name: "Y-Axis"
        },
        {
            name: "X-Axis"
        }
    ];
    resourceTypeAxis = "Y-Axis";
    precision = 2;
    tooltipOffsetX = 10;
    isGene = false;
    useYAxis = true;
    containerId = '#lioness';
    imageName = 'lioness_heatmap'; // file name for downloaded SVG image

    private readonly API_URL = environment.apiUrl;

    constructor(
        private httpClient: HttpClient,
        private readonly notificationService: NotificationService,
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

        let count = 100;
        let queryURL = `${this.API_URL}/resources/${uuid}/contents/transform/?transform-name=heatmap-reduce&mad_n=${count}`
        this.httpClient.get(queryURL).pipe(
            catchError(error => {
                console.log("Error: ", error.message);
                let message = `Error: ${error.error.error}`;
                throw message
            }))
            .subscribe(data => {
                this.isLoading = false;
                this.xAxisArr = [];
                this.yAxisArr = [];
                if (this.useYAxis) {
                    for (let i = 0; i < Object.keys(data).length; i++) {
                        this.yAxisArr.push(data[i].rowname)
                        let valuesArr = data[i].values
                        for (let item in valuesArr) {
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
                                xValue: item,
                                yValue: data[i].rowname,
                                value: data[i].values[item]
                            }
                            this.lionessData.push(temp);
                        }
                    }
                } else {
                    for (let i = 0; i < Object.keys(data).length; i++) {
                        this.xAxisArr.push(data[i].rowname)
                        let valuesArr = data[i].values
                        for (let item in valuesArr) {
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
                                yValue: item,
                                xValue: data[i].rowname,
                                value: data[i].values[item]
                            }
                            this.lionessData.push(temp);
                        }
                    }
                }
                this.createHeatmap();
            });
    }

    createHeatmap() {
        // set the dimensions and margins of the graph
        const margin = { top: 30, right: 200, bottom: 30, left: 30 },
            width = (this.windowWidth * .75) - margin.left - margin.right,
            height = this.windowHeight - margin.top - margin.bottom;

        // tool tip for individual points (if displayed)
        const pointTip = d3Tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html((event, d) => {
                let tipBox = `<div><div class="category">Samples/Observations:</div> ${this.useYAxis ? d.xValue : d.yValue}</div>
                <div><div class="category">${this.resourceType}:</div> ${this.useYAxis ? d.yValue : d.xValue}</div>
                <div><div class="category">Edge Weights: </div>${d.value}</div>`
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
            .attr('y', -margin.left + 5)
            .attr('x', -height / 2)
            .attr('dy', '.71em')
            .style('text-anchor', 'middle')
            .text(this.useYAxis ? `${this.resourceType}` : "Samples/Observations");


        svg
            .append('text')
            .classed('label', true)
            .attr('x', width / 2)
            .attr('y', height + margin.bottom - 5)
            .style('text-anchor', 'end')
            .text(this.useYAxis ? "Samples/Observations" : `${this.resourceType}`);
        ;

        let offset = Math.max(Math.abs(this.min), Math.abs(this.max))

        // Build color scale
        const myColor = d3.scaleLinear()
            .range(["royalblue", "#fffafa", "crimson",])
            .domain([-offset, 0, offset])

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

        //gradient legend
        var correlationColorData = [{ "color": "royalblue", "value": -offset }, { "color": "#fffafa", "value": 0 }, { "color": "crimson", "value": offset }];
        var extent = d3.extent(correlationColorData, d => d.value);

        var paddingGradient = 9;
        var widthGradient = 250;
        var innerWidth = widthGradient - (paddingGradient * 2);
        var barHeight = 8;
        var heightGradient = 100;

        var xScaleCorr = d3.scaleLinear()
            .range([0, innerWidth - 100])
            .domain(extent);

        // var xTicksCorr = correlationColorData.filter(f => f.value === -offset || f.value === offset).map(d => d.value);
        let xTicksCorr = [-offset, offset]

        var xAxisGradient = d3.axisBottom(xScaleCorr)
            .tickSize(barHeight * 2)
            .tickValues(xTicksCorr);

        var correlationLegend = d3.select("g")
            .append("svg")
            .attr("width", widthGradient)
            .attr("height", heightGradient)
            .attr('x', width + 5)
            .attr('y', 50);

        var defs = correlationLegend.append("defs");
        var linearGradient = defs
            .append("linearGradient")
            .attr("id", "myGradient");

        linearGradient.selectAll("stop")
            .data(correlationColorData)
            .enter().append("stop")
            .attr("offset", d => ((d.value - extent[0]) / (extent[1] - extent[0]) * 100) + "%")
            .attr("stop-color", d => d.color)

        var g = correlationLegend.append("g")
            .attr("transform", `translate(${paddingGradient + 10}, 30)`)

        g.append("rect")
            .attr("width", innerWidth - 100)
            .attr("height", barHeight)
            .style("fill", "url(#myGradient)");

        correlationLegend.append('text')
            .attr('y', 20)
            .attr('x', 17)
            .style('fill', 'rgba(0,0,0,.7)')
            .style('font-size', '11px')
            .attr("text-anchor", "start")
            .attr("font-weight", "bold")
            .text("Edge Weights");

        g.append("g")
            .call(xAxisGradient)
            .select(".domain")
    }

    onRadioChangeAxis(axis) {
        this.resourceType = axis;
        this.getData();
    }


    onRadioChangeAxis2(axis) {
        this.useYAxis = (axis === 'Y-Axis') ? true : false;
        this.getData();
    }

}