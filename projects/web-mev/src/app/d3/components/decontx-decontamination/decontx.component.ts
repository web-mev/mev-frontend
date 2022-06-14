import { Component, ChangeDetectionStrategy, Input, OnInit } from '@angular/core';
import { environment } from '@environments/environment';
import { HttpClient } from '@angular/common/http';
import { catchError } from "rxjs/operators";
import { NotificationService } from '@core/notifications/notification.service';
import { AnalysesService } from '@app/features/analysis/services/analysis.service';
import * as d3 from 'd3';


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


    constructor(
        private httpClient: HttpClient,
        private readonly notificationService: NotificationService,
        private apiService: AnalysesService,
    ) { }

    ngOnInit(): void {
        let decontxID = this.outputs["decontaminate_output"];
        // this.decontxClass["currentClass"] = [];
        this.apiService
            .getResourceContent(decontxID)
            .subscribe(res => {
                for (let i = 0; i < res.length; i++) {
                    let currentClass = res[i]['values']['decontx_class'];
                    let currentContaminationNumber = res[i]['values']['decontx_contamination'];
                    let newName = "decontx_" + currentClass;
                    if (this.decontxClass[newName] === undefined) {
                        this.decontxClass[newName] = []
                    }

                    this.decontxClass[newName].push(currentContaminationNumber);
                }
                console.log(this.decontxClass)
                this.createHistogram(0, 1, 0, 100, this.colorArray)
            });
    }
    colorArray = [
        // "#69b3a2", 
        "#9b2226",
        // "#ae2012", 
        "#bb3e03",
        // "#ca6702", 
        "#ee9b00",
        "#e9d8a6",
        "#94d2bd",
        "#0a9396",
        "#005f73"
    ]
    colorArray2 = [
        "#577590",
        "#43aa8b",
        "#90be6d",
        "#f9c74f",
        "#f8961e",
        "#f94144"
    ]

    createHistogram(xMin, xMax, yMin, yMax, color) {
        d3.select("#histogram")
            .selectAll('svg')
            .remove()
            .exit()

        // set the dimensions and margins of the graph
        let margin = { top: 10, right: 30, bottom: 20, left: 40 },
            width = 1000 - margin.left - margin.right,
            height = 600 - margin.top - margin.bottom;

        // append the svg object to the body of the page
        let svg = d3.select("#histogram")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        // X axis: scale and draw:
        let x = d3.scaleLinear()    // can use this instead of 1000 to have the max of data: d3.max(data, function(d) { return +d.price })
            .domain([xMin, xMax])
            .range([0, width]);
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));

        // set the parameters for the histogram
        let histogram = d3.histogram()
            .value(function (d) { return d; })   // I need to give the vector of value
            .domain(x.domain())  // then the domain of the graphic
            .thresholds(x.ticks(60)); // then the numbers of bins


        // And apply this function to data to get the bins
        // let bins = histogram(values);

        // Y axis: scale and draw:
        let y = d3.scaleLinear()
            .range([height, 0]);
        // y.domain([0, d3.max(bins, function (d) { return d.length; })]);   // d3.hist has to be called before the Y axis obviously
        y.domain([0, yMax]);
        svg.append("g")
            .call(d3.axisLeft(y).tickFormat(d => Math.round(d) + "%"))
        // svg.append("g")
        //     .call(d3.axisLeft(y))

        let bins1 = histogram(this.decontxClass["decontx_1"]);
        let bin1Length = this.decontxClass["decontx_1"].length

        let bins2 = histogram(this.decontxClass["decontx_2"]);
        let bins3 = histogram(this.decontxClass["decontx_3"]);
        let bins4 = histogram(this.decontxClass["decontx_4"]);
        let bins5 = histogram(this.decontxClass["decontx_5"]);
        let bins6 = histogram(this.decontxClass["decontx_6"]);
        let bin2Length = this.decontxClass["decontx_2"].length
        let bin3Length = this.decontxClass["decontx_3"].length
        let bin4Length = this.decontxClass["decontx_4"].length
        let bin5Length = this.decontxClass["decontx_5"].length
        let bin6Length = this.decontxClass["decontx_6"].length
        console.log(bins1, bins2, bins3, bins4, bins5, bins6)

        svg.selectAll("rect")
            .data(bins1)
            .enter()
            .append("rect")
            .attr("x", 1)
            .attr("transform", function (d) { return "translate(" + x(d.x0) + "," + y(d.length * (bin1Length / bin1Length)) + ")"; })
            .attr("width", function (d) { return Math.abs(x(d.x1) - x(d.x0) - 1); })
            // .attr("height", function (d) { return height - y(d.length*(bin1Length/bin1Length)); })
            .attr("height", function (d) { return height - y(d.length * (bin1Length / bin1Length)); })
            .style("fill", this.colorArray2[0])
            .style("opacity", .6)
            .style("z-index", 2)

        svg.selectAll("rect2")
            .data(bins2)
            .enter()
            .append("rect")
            .attr("x", 1)
            .attr("transform", function (d) { return "translate(" + x(d.x0) + "," + y(d.length*(bin1Length/bin2Length)) + ")"; })
            .attr("width", function (d) { return Math.abs(x(d.x1) - x(d.x0) - 1); })
            .attr("height", function (d) { return height - y(d.length*(bin1Length/bin2Length)); })
            .style("fill", this.colorArray2[1])
            .style("opacity", .6)
            .style("z-index", 3)

        svg.selectAll("rect3")
            .data(bins3)
            .enter()
            .append("rect")
            .attr("x", 1)
            .attr("transform", function (d) { return "translate(" + x(d.x0) + "," + y(d.length*(bin1Length/bin3Length)) + ")"; })
            .attr("width", function (d) { return Math.abs(x(d.x1) - x(d.x0) - 1); })
            .attr("height", function (d) { return height - y(d.length*(bin1Length/bin3Length)); })
            .style("fill", this.colorArray2[2])
            .style("opacity", .6)
            .style("z-index", 2)

        // svg.selectAll("rect4")
        //     .data(bins4)
        //     .enter()
        //     .append("rect")
        //     .attr("x", 1)
        //     .attr("transform", function (d) { return "translate(" + x(d.x0) + "," + y(d.length*(bin1Length/bin4Length)) + ")"; })
        //     .attr("width", function (d) { return Math.abs(x(d.x1) - x(d.x0) - 1); })
        //     .attr("height", function (d) { return height - y(d.length*(bin1Length/bin4Length)); })
        //     .style("fill", this.colorArray2[3])
        //     .style("opacity", .9)
        //     .style("z-index", 10)

        // svg.selectAll("rect5")
        //     .data(bins5)
        //     .enter()
        //     .append("rect")
        //     .attr("x", 1)
        //     .attr("transform", function (d) { return "translate(" + x(d.x0) + "," + y(d.length*(bin1Length/bin5Length)) + ")"; })
        //     .attr("width", function (d) { return Math.abs(x(d.x1) - x(d.x0) - 1); })
        //     .attr("height", function (d) { return height - y(d.length*(bin1Length/bin5Length)); })
        //     .style("fill", this.colorArray2[4])
        //     .style("opacity", .6)
        //     .style("z-index", 10)

        // svg.selectAll("rect6")
        //     .data(bins6)
        //     .enter()
        //     .append("rect")
        //     .attr("x", 1)
        //     .attr("transform", function (d) { return "translate(" + x(d.x0) + "," + y(d.length*(bin1Length/bin6Length)) + ")"; })
        //     .attr("width", function (d) { return Math.abs(x(d.x1) - x(d.x0) - 1); })
        //     .attr("height", function (d) { return height - y(d.length*(bin1Length/bin6Length)); })
        //     .style("fill", this.colorArray2[5])
        //     .style("opacity", .6)
        //     .style("z-index", 10)
    }

    // createBars(svg, bins, x, y, height, color) {
    //     let bar = svg.selectAll("rect")
    //         .data(bins)

    //     // bar.exit().remove()
    //     //     .transition()
    //     //     .duration(1500)

    //     bar
    //         .enter()
    //         .append("rect")
    //         .attr("transform", function (d) { return "translate(" + x(d.x0) + "," + y(d.length) + ")"; })
    //         .attr("width", function (d) { return Math.abs(x(d.x1) - x(d.x0) - 1); })
    //         .attr("height", function (d) { return height - y(d.length); })
    //         .style("fill", color)
    //         .style("opacity", 0.6)
    //         .attr("height", function (d) { return height - y(d.length); })
    // }
}