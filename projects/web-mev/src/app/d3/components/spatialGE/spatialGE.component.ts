import { Component, ChangeDetectionStrategy, Input, OnInit, } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from "rxjs/operators";
import { environment } from '@environments/environment';
import * as d3 from 'd3';
import d3Tip from 'd3-tip';

interface ScatterData {
    xValue: number;
    yValue: number;
    totalCounts: number;
  }

@Component({
    selector: 'mev-spatialGE',
    templateUrl: './spatialGE.component.html',
    styleUrls: ['./spatialGE.component.scss'],
    changeDetection: ChangeDetectionStrategy.Default
})
export class SpatialGEComponent implements OnInit {
    @Input() outputs;
    private readonly API_URL = environment.apiUrl;

    containerId = '#scatter';

    isLoading = true;
    
    scatterPlotData: ScatterData[] = [];

    dataDict = {}

    xMin = Infinity
    xMax = -Infinity
    yMin = Infinity
    yMax = -Infinity
    totalCountsMax = 0;
    totalCountsMin = Infinity;

    totalCounts: any = {}

    scaleFactor = 0.0836575;

    selectedColor: string = 'Red';
    colors: string[] = ['Red', 'Green']

    plotOpacityValue = 1
    imageOpacityValue = .5

    overlayImage: boolean = false;
    displayPlot: boolean = true;
    displayImage: boolean = true;

    displayCrop: boolean = false;

    constructor(
        private httpClient: HttpClient,
    ) { }

    ngOnInit(): void {
        this.getData()
    }

    getData() {
        let uuid = this.outputs["normalized_expression"];
        let gene = 'VIM';
        this.httpClient.get(
            `${this.API_URL}/resources/${uuid}/contents/?__rowname__=[eq]:${gene}`).pipe(
                catchError(error => {
                    throw error;
                }))
            .subscribe(res => {
                console.log("normalized expression: ", res[0])
                for (let i in res[0]['values']) {
                    let key = i;
                    let count = res[0]['values'][i]
                    this.dataDict[key] = {
                        ...this.dataDict[key],
                        count
                    }
                }
                console.log("dataDict after norm: ", this.dataDict)
                this.getMinMaxValues()
            })

        let coords_metadata_uuid = this.outputs["coords_metadata"]
        this.httpClient.get(
            `${this.API_URL}/resources/${coords_metadata_uuid}/contents/`).pipe(
                catchError(error => {
                    throw error;
                }))
            .subscribe(res => {
                for (let i in res) {
                    let obj = res[i]
                    let key = obj['rowname']
                    let xVal = obj['values']['pxl_col_in_fullres']
                    let yVal = obj['values']['pxl_row_in_fullres']
                    this.dataDict[key] = {
                        ...this.dataDict[key],
                        xVal,
                        yVal
                    }
                }
                console.log("dataDict: ", this.dataDict)
            })
    }


    getMinMaxValues() {
        for (let i in this.dataDict) {
            const parsedX = parseInt(this.dataDict[i]['xVal'])
            const parsedY = parseInt(this.dataDict[i]['yVal'])
            const totalCounts = parseFloat(parseFloat(this.dataDict[i]['count']).toFixed(3));

            if (!isNaN(parsedX) && !isNaN(parsedY) && !isNaN(totalCounts)) {
                let temp = {
                    "xValue": parsedX,
                    "yValue": parsedY,
                    "totalCounts": totalCounts
                }
                let keyName = parsedX + "_" + parsedY
                this.totalCounts[keyName] = totalCounts
                this.scatterPlotData.push(temp)

                this.xMin = Math.min(this.xMin, parsedX);
                this.xMax = Math.max(this.xMax, parsedX);

                this.yMin = Math.min(this.yMin, parsedY);
                this.yMax = Math.max(this.yMax, parsedY);

                this.totalCountsMax = Math.max(this.totalCountsMax, totalCounts)
                this.totalCountsMin = Math.min(this.totalCountsMin, totalCounts)
            }
        }
        this.createScatterPlot()
        this.isLoading = false;
        console.log("min/max: ", this.xMin, this.xMax, this.yMin, this.yMax, this.totalCountsMin, this.totalCountsMax)
    }

    createScatterPlot() {
        //Margin right is the space allocated for the legend. 
        //The width needs to match with the width of the image (ie image width = 400px. so total plot width needs to be 400px after taking into account the margins)
        var margin = { top: 0, right: 70, bottom: 0, left: 0 },
            width = 470 - margin.left - margin.right,
            height = 395 - margin.top - margin.bottom;

        d3.select(this.containerId)
            .selectAll('svg')
            .remove();

        const pointTip = d3Tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html((event: any, d: any) => {
                let tipBox = `<div><div class="category">Normalized Count:</div> ${d.totalCounts}</div>`
                return tipBox
            });

        // append the svg object to the body of the page
        var svg = d3.select(this.containerId)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        svg.call(pointTip);

        const color = d3.scaleLinear<string>()
            .domain([0, this.totalCountsMax])
            .range(["rgba(0, 0, 0, 0)", this.selectedColor]);

        var x = d3.scaleLinear()
            .domain([this.xMin * (this.scaleFactor), this.xMax * (1 + this.scaleFactor)])
            .range([0, width]);

        // Add Y axis
        var y = d3.scaleLinear()
            .domain([this.yMin * this.scaleFactor, this.yMax * (1 + this.scaleFactor)])
            .range([height, 0]);

        // Add dots
        svg.append('g')
            .selectAll("dot")
            .data(this.scatterPlotData)
            .enter()
            .append("circle")
            .attr("cx", function (d) { return x(d.xValue) })
            .attr("cy", function (d) { return height - y(d.yValue); })
            .attr("r", 2)
            .attr("fill", function (d) {
                return color(d.totalCounts)
            })
            .on('mouseover', function (mouseEvent: any, d) {
                pointTip.show(mouseEvent, d, this);
                pointTip.style('left', mouseEvent.x + 10 + 'px');
            })
            .on('mouseout', pointTip.hide);

        //Add Legend
        const gradient = svg.append("defs")
            .append("linearGradient")
            .attr("id", "legendGradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%");

        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "white");

        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", this.selectedColor);

        const legendX = 400;
        const legendY = 100;
        const borderWidth = 1;
        const legendWidth = 50;
        const legendHeight = 10;

        svg.append("rect")
            .attr("x", legendX - borderWidth)
            .attr("y", legendY - borderWidth)
            .attr("width", legendWidth + 2 * borderWidth)
            .attr("height", legendHeight + 2 * borderWidth)
            .style("stroke", "rgba(0, 0, 0, 0.3)")
            .style("fill", "none");

        // Create legend rectangle
        svg.append("rect")
            .attr("x", legendX)
            .attr("y", legendY)
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", "url(#legendGradient)")

        svg.append("text")
            .attr("x", 400)
            .attr("y", 120)
            .attr("text-anchor", "start")
            .attr("font-size", "6px")
            .text("0");

        const xmaxLabelWidth = this.totalCountsMax.toString().toLocaleString().length * 1;  // Adjust the font size multiplier as needed
        const adjustedXmaxLabelX = 400 + 60 - xmaxLabelWidth;

        svg.append("text")
            .attr("x", adjustedXmaxLabelX)
            .attr("y", 120)
            .attr("text-anchor", "end")
            .attr("font-size", "6px")
            .text(this.totalCountsMax.toLocaleString());
    }

}