import { Component, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges } from '@angular/core';
import * as d3 from 'd3';
import d3Tip from 'd3-tip';
import * as d3Collection from 'd3-collection';
import { MatDialog } from '@angular/material/dialog';
import { AddSampleSetComponent } from '../../dialogs/add-sample-set/add-sample-set.component';
import { CustomSetType } from '@app/_models/metadata';
import { MetadataService } from '@app/core/metadata/metadata.service';

@Component({
  selector: 'mev-likelihood-box-plot',
  templateUrl: './box-plot.component.html',
  styleUrls: ['./box-plot.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})

export class LikelihoodBoxPlotComponent implements OnChanges {
  @Input() resourceData;
  @Input() limit = 6;
  @Input() pageIndex;

  imageName = 'boxplot';
  containerId = '#boxplot';
  isWaiting = false;
  boxPlotData = [];
  min = Infinity;
  max = -Infinity;
  xAxisArr = [];
  sumstat = [];
  showPoints = false;

  groupArr = [];
  myColor = ["#fd7f6f", "#7eb0d5", "#b2e061", "#bd7ebe", "#ffb55a", "#ffee65", "#beb9db", "#fdcce5", "#8bd3c7", "#9080ff"];
  pointsToPlot = [];
  boxPlotTypes = {};
  checkboxData = {};
  selectedSamples = [];
  currPageIndex = 0;

  constructor(
    private metadataService: MetadataService,
    public dialog: MatDialog
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    this.currPageIndex = this.pageIndex - 1;
    this.resetVariables();
    this.isWaiting = true;
    this.boxPlotData = this.resourceData;
    this.getXAxisValues();
  }

  getXAxisValues() {
    if (this.sumstat.length === 0) {
      this.sumstat = d3Collection.nest() // nest function allows to group the calculation per level of a factor
        .key(function (d) { return d.key; })
        .rollup(function (d) {
          let q1 = d3.quantile(d.map(function (g) { return g.value; }).sort(d3.ascending), .25)
          let median = d3.quantile(d.map(function (g) { return g.value; }).sort(d3.ascending), .5)
          let q3 = d3.quantile(d.map(function (g) { return g.value; }).sort(d3.ascending), .75)
          let interQuantileRange = q3 - q1
          let min = q1 - 1.5 * interQuantileRange
          let max = q3 + 1.5 * interQuantileRange
          return ({ q1: q1, median: median, q3: q3, interQuantileRange: interQuantileRange, min: min, max: max, group: d[0].group })
        })
        .entries(this.boxPlotData)
    }

    for (let index in this.boxPlotData) {
      if (!this.groupArr.includes(this.boxPlotData[index]['group'])) {
        this.groupArr.push(this.boxPlotData[index]['group'])

        let name = this.boxPlotData[index]['group']
        let temp = {
          name: name,
          checked: false,
          sampleIds: []
        }
        this.checkboxData[name] = temp;
      }
    }
    let groupLength = this.groupArr.length
    // let startIndex = this.currPageIndex * this.limit * groupLength
    let slicedSumStat = this.sumstat.slice(0, this.limit * groupLength)

    for (let index in slicedSumStat) {
      this.xAxisArr.push(slicedSumStat[index]['key'])
    }

    for (let index in this.boxPlotData) {

      if (this.xAxisArr.includes(this.boxPlotData[index].key)) {
        this.pointsToPlot.push(this.boxPlotData[index]);

        let currGroup = this.boxPlotData[index].group;
        let currSampleId = this.boxPlotData[index].name;

        if (!this.checkboxData[currGroup].sampleIds.includes(currSampleId)) {
          this.checkboxData[currGroup].sampleIds.push(currSampleId)
        }
      }
    }

    this.setBoxPlotTypes();
  }

  setBoxPlotTypes() {
    if (this.groupArr.length) {
      for (let i = 0; i < this.groupArr.length; i++) {
        let set = this.groupArr[i]
        this.boxPlotTypes[set] = {
          label: set,
          color: this.myColor[i]
        };
      }
    } else {
      this.boxPlotTypes['All samples'] = {
        label: 'All samples',
        color: '#69b3a2'
      };
    }
    this.createBoxPlot();
  }

  togglePoints() {
    this.showPoints = !this.showPoints;
    this.resetVariables();
    this.boxPlotData = this.resourceData;
    this.isWaiting = true;
    this.getXAxisValues();
  }

  toggleCheckBoxGroup(name) {
    this.checkboxData[name].checked = !this.checkboxData[name].checked;
    this.selectedSamples = [];

    for (let cat in this.checkboxData) {
      if (this.checkboxData[cat].checked === true) {
        this.selectedSamples = this.selectedSamples.concat(this.checkboxData[cat].sampleIds);
      }
    }
  }

  resetVariables() {
    this.boxPlotData = [];
    this.min = Infinity;
    this.max = -Infinity;
    this.xAxisArr = [];
    this.pointsToPlot = [];
    this.sumstat = [];
  }


  createBoxPlot() {
    this.isWaiting = false;

    // set the dimensions and margins of the graph
    const outerWidth = Math.max(window.innerWidth * 0.66, 800);
    const outerHeight = Math.max(window.innerHeight * 0.75, 500);
    var margin = { top: 10, right: 150, bottom: 125, left: 100 };
    var width = outerWidth - margin.left - margin.right;
    var height = outerHeight - margin.top - margin.bottom;

    d3.select("#boxplot")
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

    // append the svg object to the body of the page
    var svg = d3.select("#boxplot")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

    svg.call(pointTip);

    let groupLength = this.groupArr.length;
    let slicedSumStat = this.sumstat.slice(0, this.limit * groupLength);

    for (let i = 0; i < slicedSumStat.length; i++) {
      let currMin = slicedSumStat[i].value.min;
      let currMax = slicedSumStat[i].value.max;

      this.min = Math.min(this.min, currMin);
      this.max = Math.max(this.max, currMax);
    }
    this.min = this.min > 0 ? this.min * .9 : this.min * 1.1;
    this.max = this.max * 1.1;

    // Show the X scale
    var x = d3.scaleBand()
      .range([0, width])
      .domain(this.xAxisArr)
      .paddingInner(1)
      .paddingOuter(.5)

    var xAxisFilter = d3.axisBottom(x)
      .tickValues(x.domain().filter(d => {
        return d.includes(this.groupArr[0])
      }))
      .tickSize(0)

    let labelPosition = width / this.limit;

    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxisFilter)
      .selectAll('.tick')
      .attr('transform', (d, i) => { return "translate(" + (i * labelPosition + labelPosition / 2) + ",10)" })
      .selectAll('text')
      .text(d => {
        let endIndex = d.indexOf("_")
        return d.substring(0, endIndex)
      })
      .style('text-anchor', 'end')
      .attr('dx', "0px")
      .attr('dy', "0px")
      .attr('transform', 'rotate(-45)');

    // Show the Y scale
    var y = d3.scaleLinear()
      .domain([this.min, this.max])
      .range([height, 0])
    svg.append("g").call(d3.axisLeft(y))

    // Show the main vertical line
    svg
      .selectAll("vertLines")
      .data(slicedSumStat)
      .enter()
      .append("line")
      .attr("x1", function (d) { return (x(d.key)) })
      .attr("x2", function (d) { return (x(d.key)) })
      .attr("y1", function (d) { return (y(d.value.min)) })
      .attr("y2", function (d) { return (y(d.value.max)) })
      .attr("stroke", "black")
      .style("width", 40)

    // // rectangle for the main box
    var boxWidth = (width * .75) / (this.limit * this.groupArr.length);
    let bpType = this.boxPlotTypes;
    svg
      .selectAll("boxes")
      .data(slicedSumStat)
      .enter()
      .append("rect")
      .attr("x", function (d) { return (x(d.key) - boxWidth / 2) })
      .attr("y", function (d) { return (y(d.value.q3)) })
      .attr("height", function (d) { return (y(d.value.q1) - y(d.value.q3)) })
      .attr("width", boxWidth)
      .attr("stroke", "black")
      .style("fill", function (d) {
        let cat = d["value"].group
        return bpType[cat].color
      })
      .on('mouseover', function (mouseEvent: any, d) {
        pointTip.show(mouseEvent, d, this);
        pointTip.style('left', mouseEvent.x + 10 + 'px');
      })
      .on('mouseout', pointTip.hide);

    // // Show the median
    svg
      .selectAll("medianLines")
      .data(slicedSumStat)
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
      .style('font-size', '10px')
      .text("Expression")

    svg
      .append('text')
      .classed('label', true)
      .attr("font-weight", "bold")
      .attr('x', width / 2)
      .attr('y', height + margin.bottom - 10)
      .style('fill', 'rgba(0,0,0,.8)')
      .style('text-anchor', 'middle')
      .style('font-size', '10px')
      .text("Gene")

    // Add individual points with jitter
    var jitterWidth = boxWidth; //How far the points are scattered in the x-direction

    if (this.showPoints === true) {
      svg
        .selectAll("indPoints")
        .data(this.pointsToPlot)
        .enter()
        .append("circle")
        .attr("cx", function (d) { return (x(d.key) - jitterWidth / 2 + Math.random() * jitterWidth) })
        .attr("cy", function (d) { return (y(d.value)) })
        .attr("r", 2)
        .style("fill", "white")
        .attr("stroke", "black")
    }

    const boxPlotColors = Object.keys(this.boxPlotTypes).map(key => ({
      label: this.boxPlotTypes[key].label,
      color: this.boxPlotTypes[key].color
    }));

    const legend = svg
      .selectAll('.legend')
      .data(boxPlotColors)
      .enter()
      .append('g')
      .classed('legend', true)
      .attr('transform', function (d, i) {
        return 'translate(0,' + (i * 20 + 40) + ')';
      });

    legend
      .append('circle')
      .attr('r', 5)
      .attr('cx', width + 10)
      .attr('fill', d => d.color);

    legend
      .append('text')
      .attr('x', width + 20)
      .attr('dy', '.35em')
      .style('fill', '#000')
      .style('font-size', '12px')
      .attr('class', 'legend-label')
      .text(d => d.label);
  }

  /**
   * Function that is triggered when the user clicks the "Create a custom sample" button
   */
  onCreateCustomSampleSet() {
    let samples = this.selectedSamples.map(elem => ({ id: elem }));
    const dialogRef = this.dialog.open(AddSampleSetComponent, {
      data: { type: CustomSetType.ObservationSet }
    });

    dialogRef.afterClosed().subscribe(customSetData => {
      if (customSetData) {
        const customSet = {
          name: customSetData.name,
          type: CustomSetType.ObservationSet,
          color: customSetData.color,
          elements: samples,
          multiple: true
        };

        // if the custom set has been successfully added, reset selectedSamples
        if (this.metadataService.addCustomSet(customSet)) {
          this.selectedSamples = [];
        }
      }
    })
  }
}
