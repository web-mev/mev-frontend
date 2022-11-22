import { Component, ChangeDetectionStrategy, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import * as d3 from 'd3';
import d3Tip from 'd3-tip';
import { HttpClient } from '@angular/common/http';
import { catchError } from "rxjs/operators";
import { nest } from 'd3-collection';
import * as d3Collection from 'd3-collection';

@Component({
  selector: 'mev-likelihood-box-plot',
  templateUrl: './box-plot.component.html',
  styleUrls: ['./box-plot.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})

export class LikelihoodBoxPlotComponent implements OnInit, OnChanges {
  @Input() metadataCatId = '';
  @Input() metadataNumId = '';
  @Input() metadataLookUp = {};
  // @Input() typeOfLookUp = 'mcc';
  // @Input() symbolId = '';

  @Input() resourceData

  isLoading = false;
  boxPlotData = [];
  min = Infinity;
  max = -Infinity;
  xAxisArr = [];
  sumstat = [];

  limit = 1000;

  constructor(private httpClient: HttpClient) { }

  ngOnInit(): void { }

  ngOnChanges(changes: SimpleChanges): void {
    this.isLoading = true;
    this.boxPlotData = this.resourceData;
    this.getXAxisValues();
    this.createBoxPlot()

  }

  getXAxisValues() {
    for (let index in this.boxPlotData) {
      if (!this.xAxisArr.includes(this.boxPlotData[index]['key'])) {
        this.xAxisArr.push(this.boxPlotData[index]['key'])
      }
    }
  }

  resetVariables() {
    this.boxPlotData = [];
    this.min = Infinity;
    this.max = -Infinity;
    this.xAxisArr = [];
  }

  createBoxPlot() {
    // set the dimensions and margins of the graph
    var margin = { top: 10, right: 30, bottom: 100, left: 100 },
      width = 800 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

    d3.select("#my_boxplot")
      .selectAll('svg')
      .remove();

    const pointTip = d3Tip()
      .attr('class', 'd3-tip')
      .offset([-10, 0])
      .html((event, d) => {
        let tipBox = `<div><div class="category">Name: </div> ${d.key}</div>
    <div><div class="category">Max: </div> ${d.value.max.toFixed(2)}</div>
    <div><div class="category">Q3: </div> ${d.value.q3.toFixed(2)}</div>
    <div><div class="category">Median: </div> ${d.value.median.toFixed(2)}</div>
    <div><div class="category">Q1: </div> ${d.value.q1.toFixed(2)}</div>
    <div><div class="category">Min: </div> ${d.value.min.toFixed(2)}</div>`
        return tipBox
      });

    const yAxisTip = d3Tip()
      .attr('class', 'd3-tip')
      .offset([-10, 0])
      .html((event) => {
        let tipBox = `<div><div class="category">Y Axis: ${this.metadataLookUp[this.metadataNumId].vardescFull}</div> </div>`
        return tipBox
      });

    const xAxisTip = d3Tip()
      .attr('class', 'd3-tip')
      .offset([-10, 0])
      .html((event) => {
        let tipBox = `<div><div class="category">X Axis: ${this.metadataLookUp[this.metadataCatId].vardescFull}</div> </div>`
        return tipBox
      });

    // append the svg object to the body of the page
    var svg = d3.select("#my_boxplot")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

    svg.call(pointTip);
    svg.call(yAxisTip);
    svg.call(xAxisTip);

    let tempMin = this.min
    let tempMax = this.max

    // Compute quartiles, median, inter quantile range min and max --> these info are then used to draw the box.
    this.sumstat = d3Collection.nest() // nest function allows to group the calculation per level of a factor
      .key(function (d) { return d.key; })
      .rollup(function (d) {
        let q1 = d3.quantile(d.map(function (g) { return g.value; }).sort(d3.ascending), .25)
        let median = d3.quantile(d.map(function (g) { return g.value; }).sort(d3.ascending), .5)
        let q3 = d3.quantile(d.map(function (g) { return g.value; }).sort(d3.ascending), .75)
        let interQuantileRange = q3 - q1
        let min = q1 - 1.5 * interQuantileRange
        let max = q3 + 1.5 * interQuantileRange

        tempMin = Math.min(min, tempMin)
        tempMax = Math.max(max, tempMax)
        return ({ q1: q1, median: median, q3: q3, interQuantileRange: interQuantileRange, min: min, max: max })
      })
      .entries(this.boxPlotData)

    this.min = tempMin > 0 ? tempMin * .8 : tempMin * 1.2;
    this.max = tempMax * 1.2;

    if (this.sumstat.length > 12) {
      this.sumstat.sort((b, a) => b.value.median - a.value.median)
      let slicedArr = this.sumstat.slice(0, 6).concat(this.sumstat.slice(this.sumstat.length - 6, this.sumstat.length))
      this.sumstat = slicedArr;
      this.xAxisArr = [];
      for (let i = 0; i < this.sumstat.length; i++) {
        this.xAxisArr.push(this.sumstat[i].key)
      }
    }

    // Show the X scale
    var x = d3.scaleBand()
      .range([0, width])
      .domain(this.xAxisArr)
      .paddingInner(1)
      .paddingOuter(.5)
    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x))

    // Show the Y scale
    var y = d3.scaleLinear()
      .domain([this.min, this.max])
      .range([height, 0])
    svg.append("g").call(d3.axisLeft(y))

    // Show the main vertical line
    svg
      .selectAll("vertLines")
      .data(this.sumstat)
      .enter()
      .append("line")
      .attr("x1", function (d) { return (x(d.key)) })
      .attr("x2", function (d) { return (x(d.key)) })
      .attr("y1", function (d) { return (y(d.value.min)) })
      .attr("y2", function (d) { return (y(d.value.max)) })
      .attr("stroke", "black")
      .style("width", 40)

    // // rectangle for the main box
    var boxWidth = 20
    svg
      .selectAll("boxes")
      .data(this.sumstat)
      .enter()
      .append("rect")
      .attr("x", function (d) { return (x(d.key) - boxWidth / 2) })
      .attr("y", function (d) { return (y(d.value.q3)) })
      .attr("height", function (d) { return (y(d.value.q1) - y(d.value.q3)) })
      .attr("width", boxWidth)
      .attr("stroke", "black")
      .style("fill", "#69b3a2")
      .on('mouseover', function (mouseEvent: any, d) {
        pointTip.show(mouseEvent, d, this);
        pointTip.style('left', mouseEvent.x + 10 + 'px');
      })
      .on('mouseout', pointTip.hide);

    // // Show the median
    svg
      .selectAll("medianLines")
      .data(this.sumstat)
      .enter()
      .append("line")
      .attr("x1", function (d) { return (x(d.key) - boxWidth / 2) })
      .attr("x2", function (d) { return (x(d.key) + boxWidth / 2) })
      .attr("y1", function (d) { return (y(d.value.median)) })
      .attr("y2", function (d) { return (y(d.value.median)) })
      .attr("stroke", "black")
      .style("width", 80)

    svg.append('text')
      .classed('label', true)
      .attr('transform', 'rotate(-90)')
      .attr("font-weight", "bold")
      .attr('y', -margin.left + 10)
      .attr('x', -height / 2)
      .attr('dy', '.71em')
      .style('fill', 'rgba(0,0,0,.8)')
      .style('text-anchor', 'middle')
      .style('font-size', '8px')
      .text("hello")
      .on('mouseover', function (mouseEvent: any) {
        yAxisTip.show(mouseEvent, this);
        yAxisTip.style('left', mouseEvent.x + 10 + 'px');
        d3.select(this).style("cursor", "pointer");
      })
      .on('mouseout', function (mouseEvent: any) {
        d3.select(this).style("cursor", "default");
      })
      .on('mouseout', yAxisTip.hide);


    svg
      .append('text')
      .classed('label', true)
      .attr("font-weight", "bold")
      .attr('x', width / 2)
      .attr('y', height + margin.bottom - 10)
      .style('fill', 'rgba(0,0,0,.8)')
      .style('text-anchor', 'middle')
      .style('font-size', '8px')
      .text("moto")
      .on('mouseover', function (mouseEvent: any) {
        xAxisTip.show(mouseEvent, this);
        xAxisTip.style('left', mouseEvent.x + 10 + 'px');
        d3.select(this).style("cursor", "pointer");
      })
      .on('mouseout', function (mouseEvent: any) {
        d3.select(this).style("cursor", "default");
      })
      .on('mouseout', xAxisTip.hide);
  }

  refreshData() {
    this.boxPlotData = [];
    this.min = Infinity;
    this.max = -Infinity;
  }
}
