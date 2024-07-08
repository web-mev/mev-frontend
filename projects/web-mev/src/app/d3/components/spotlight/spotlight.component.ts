import { Component, ChangeDetectionStrategy, OnInit, Input } from '@angular/core';
import { catchError } from "rxjs/operators";
import * as d3 from 'd3';
import d3Tip from 'd3-tip';
import { forkJoin } from 'rxjs';
import { BaseSpatialgeComponent } from '../base-spatialge/base-spatialge.component';


@Component({
    selector: 'mev-spotlight',
    templateUrl: './spotlight.component.html',
    styleUrls: ['./spotlight.component.scss'],
    changeDetection: ChangeDetectionStrategy.Default
})
export class SpotlightComponent extends BaseSpatialgeComponent implements OnInit {
    @Input() outputs;

    limit = 0.1

    plotData = {};
    plot_width_in_pixels = 300; //sets the width of the plot in pixels
    geneDict: any = {};

    pieChartColors: any = {};
    colorIndex = 0;
    colorsArray = [
        "#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c",
        "#98df8a", "#d62728", "#ff9896", "#9467bd", "#c5b0d5",
        "#8c564b", "#c49c94", "#e377c2", "#f7b6d2", "#7f7f7f",
        "#c7c7c7", "#bcbd22", "#dbdb8d", "#17becf", "#9edae5"
    ];
    low_res_scalefactor = '0.0218635';

    ngOnInit(): void {
        this.scaleFactorVal = this.low_res_scalefactor;
        this.scaleFactor = parseFloat(this.low_res_scalefactor);
        this.operationName = this.outputs.operation.operation_name;
        this.onActionSpotlight.subscribe(() => {
            this.createScatterplotSpotlight('normal')
            this.createScatterplotSpotlight('minimap')
        })

        this.hideMinimapImage = true; 
        
        this.getData()
    }

    resetSpotlightVariables() {
        this.plotData = {};
        this.geneDict = {};
        this.pieChartColors = {};
        this.colorIndex = 0;
    }

    getData() {
        this.showMiniMap = true;
        this.isLoading = true;
        this.scrollTo('topOfPage');
        this.resetAllVariables();
        this.resetSpotlightVariables();

        // this.currentImageLeft = 182.5
        // this.currentImageTop = 15
        // this.currentLeft = 80 
        // this.currentTop = 180
        // this.heightAdjustment = -100
        // this.widthAdjustment = -100

        this.geneSearchHeight = -100;
        let deconvoluted_outputs_uuid = this.outputs["deconvoluted_output"];
        let coords_metadata_uuid = this.outputs["coords_metadata"];

        const spotlightRequest = this.httpClient.get(`${this.API_URL}/resources/${deconvoluted_outputs_uuid}/contents/`).pipe(
            catchError(error => {
                this.isLoading = false;
                this.notificationService.error(`Error ${error.status}: Error from normalized expression request.`);
                console.log("some error message from norm: ", error)
                throw error;
            })
        );

        const coordsMetadataRequest = this.httpClient.get(`${this.API_URL}/resources/${coords_metadata_uuid}/contents/`).pipe(
            catchError(error => {
                this.isLoading = false;
                this.notificationService.error(`Error ${error.status}: Error from coordinates metadata request.`);
                console.log("some error from coord: ", error)
                throw error;
            })
        );


        forkJoin([spotlightRequest, coordsMetadataRequest]).subscribe(([spotlightRes, coordsMetadataRes]) => {
            this.isLoading = false;

            for (let index in coordsMetadataRes) {
                let gene = coordsMetadataRes[index]
                let key = gene.rowname
                let x = gene.values["pxl_y"]
                let y = gene.values["pxl_x"]
                this.xMin = Math.min(this.xMin, x)
                this.xMax = Math.max(this.xMax, x)
                this.yMin = Math.min(this.yMin, y)
                this.yMax = Math.max(this.yMax, y)

                this.plotData[key] = {
                    x,
                    y
                }

                let normalizePlot = (this.xMax - this.xMin) / 500 // This will set the plot to a width of 500px
                this.plotWidth = (this.xMax - this.xMin) / normalizePlot;
                this.plotHeight = (this.yMax - this.yMin) / normalizePlot;
            }
            if (this.originalPlotWidth === 0) {
                this.originalPlotWidth = this.plotWidth;
                this.originalPlotHeight = this.plotHeight;
            }

            let selectionRectWidth = (this.plotWidth + this.widthAdjustment) / (4 * this.currentZoomVal);
            let selectionRectHeight = (this.plotHeight + this.heightAdjustment) / (4 * this.currentZoomVal);

            this.selectionRectStyle = {
                top: `-${0}px`,
                left: `-${0}px`,
                width: `${selectionRectWidth}px`,
                height: `${selectionRectHeight}px`,
                border: '2px solid #1DA1F2',
                position: 'absolute',
            };

            this.maxImageContainerWidthSidebySide = this.plotWidth * 2;

            for (let index in spotlightRes) {
                let gene = spotlightRes[index];
                let geneName = gene.rowname;
                for (const key in gene.values) {

                    if (!this.pieChartColors[geneName]) {
                        this.pieChartColors[geneName] = this.colorsArray[this.colorIndex]
                        this.colorIndex++;
                    }

                    if (gene.values[key] > this.limit) {
                        let temp = {
                            [geneName]: gene.values[key]
                        }
                        let edittedKey = key.replace(".", "-");
                        if (this.plotData[edittedKey]["pieData"] === undefined) {
                            this.plotData[edittedKey]["pieData"] = []
                        }
                        this.plotData[edittedKey]["pieData"].push(temp)
                    }
                }

            }
            this.formatData()
        })
    }

    formatData() {
        for (let index in this.plotData) {
            let obj = this.plotData[index]

            let sum = 0
            if (obj.pieData) {
                for (let geneObj of obj.pieData) {
                    for (const key in geneObj) {
                        sum += Number(geneObj[key])
                    }
                }
                for (let geneObj of obj.pieData) {
                    for (const key in geneObj) {
                        let newVal = Number(geneObj[key]) / sum * 100;
                        let temp = {
                            label: key,
                            value: newVal,
                            name: index
                        }
                        if (!this.plotData[index]["pieData2"]) {
                            this.plotData[index]["pieData2"] = []
                        }
                        this.plotData[index]["pieData2"].push(temp)
                        let temp2 = {
                            label: key,
                            value: newVal
                        }

                        if (!this.geneDict[index]) {
                            this.geneDict[index] = []
                        }
                        this.geneDict[index].push(temp2)

                    }
                }
            }
        }
        //convert to an array. fix this later.
        for (let geneName in this.plotData) {
            this.scatterPlotData.push(this.plotData[geneName])
        }
        this.createScatterplotSpotlight('normal')
        this.createScatterplotSpotlight('minimap')
    }

    createScatterplotSpotlight(size: string): void {
        let adjObj = {
            current_left: 0,
            current_top: 0,
            current_image_left: this.currentImageLeft,
            current_image_top: this.currentImageTop,
            width_adjustment: this.widthAdjustment,
            height_adjustment: this.heightAdjustment,
            zoom_scale_factor: this.currentZoomVal,
            legend_width: this.legendWidth,
            plot_height: this.plotHeight,
            plot_width: this.plotWidth,
            size,


        }

        this.displayPlot = true;
        let scatterplotContainerId = size === 'normal' ? this.containerId : this.minimapContainerId;
        const data = this.scatterPlotData

        var margin = { top: 0, right: 0, bottom: 0, left: size === 'normal' ? this.legendWidth : 0 },
            width = size === 'normal' ? this.plotWidth - margin.left - margin.right + this.widthAdjustment + this.legendWidth : (this.plotWidth - margin.left - margin.right + this.widthAdjustment) / 4,
            height = size === 'normal' ? this.plotHeight - margin.top - margin.bottom + this.heightAdjustment : (this.plotHeight - margin.top - margin.bottom + this.heightAdjustment) / 4;


        d3.select(scatterplotContainerId)
            .selectAll('svg')
            .remove();

        const pointTip = d3Tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html((event: any, d: any) => {
                let tipBox = `<div style="font-weight: bold;">${d.data.name}</div>`;
                for (let key in this.geneDict[d.data.name]) {
                    tipBox += `<div style="display: inline-block;><div style="font-weight: bold;">${this.geneDict[d.data.name][key].label}:</div> ${Math.round(this.geneDict[d.data.name][key].value)}%</div><br>`
                }
                return tipBox
            });

        const svg = d3.select(scatterplotContainerId)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        svg.call(pointTip);

        const x = d3.scaleLinear()
            .domain([this.xMin - (this.xMax - this.xMin) * this.scaleFactor, this.xMax + (this.xMax - this.xMin) * this.scaleFactor])
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([this.yMin - (this.yMax - this.yMin) * this.scaleFactor, this.yMax + (this.yMax - this.yMin) * this.scaleFactor])
            .range([0, height]);

        // Add pie charts for each data point
        data.forEach((d: any) => {
            const pie = d3.pie<any>().value((p: any) => p.value);

            // Create arc generator
            // @ts-ignore
            const arc = d3.arc()
                .innerRadius(0)
                .outerRadius(size === 'normal' ? 2.5 : 1) as d3.ValueFn<SVGPathElement, d3.PieArcDatum<any>, string | null>

            if (d.pieData2) {
                const pieData = pie(d.pieData2);
                const pieGroup = svg.append("g")
                    .attr("transform", `translate(${x(d.x)}, ${y(d.y)})`);

                pieGroup.selectAll("path")
                    .data(pieData)
                    .enter()
                    .append("path")
                    .attr("d", arc)
                    .attr("fill", (p: any) => {
                        return this.pieChartColors[p.data.label]; // Assuming each data point has a 'key' property
                    });

                if (size === 'normal') {
                    pieGroup
                        .data(pieData)
                        .on('mouseover', function (mouseEvent: any, d) {
                            pointTip.show(mouseEvent, d, this);
                            pointTip.style('left', mouseEvent.x + 10 + 'px');
                        })
                        .on('mouseout', pointTip.hide);
                }
            }
        });
        if (this.legendWidth !== 0 && size !== 'minimap') {
            // Add Legend
            const clusterColors = Object.keys(this.pieChartColors).map(key => ({
                label: key,
                color: this.pieChartColors[key]
            }));
            clusterColors.sort((a, b) => {
                // Extracting the numerical part of the label
                const numA = parseInt(a.label.split(' ')[1]);
                const numB = parseInt(b.label.split(' ')[1]);

                // Comparing the numerical parts
                return numA - numB;
            });
            const legend = svg
                .selectAll('.legend')
                .data(clusterColors)
                .enter()
                .append('g')
                .classed('legend', true)
                .attr('transform', function (d, i) {
                    return `translate(${-(width + 130)}, ${i * 20 + 50})`;
                });

            legend
                .append('circle')
                .attr('r', 4)
                .attr('cx', width + 20)
                .attr('fill', d => d.color);

            legend
                .append('text')
                .attr('x', width + 30)
                .attr('dy', '.35em')
                .style('fill', '#000')
                .style('font-size', '8px')
                .attr('class', 'legend-label')
                .text(d => d.label)
                .call(this.wrap, this.legendWidth - 5);
        }

    }

    wrap(text, width) {
        text.each(function () {
            var text = d3.select(this),
                words = text.text().split(/\s+/).reverse(),
                word,
                line = [],
                lineNumber = 0,
                lineHeight = 1.1, // ems
                x = text.attr("x"),
                y = text.attr("y"),
                dy = 0, //parseFloat(text.attr("dy")),
                tspan = text.text(null)
                    .append("tspan")
                    .attr("x", x)
                    .attr("y", y + 2)
                    .attr("dy", dy + "em");
            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
                if (tspan.node().getComputedTextLength() > width) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = text.append("tspan")
                        .attr("x", x)
                        .attr("y", y)
                        .attr("dy", ++lineNumber * lineHeight + dy + "em")
                        .text(word);
                }
            }
        });
    }
}