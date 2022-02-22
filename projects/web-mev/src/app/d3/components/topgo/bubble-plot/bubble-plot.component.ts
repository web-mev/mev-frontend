import { Component, Input, OnChanges } from '@angular/core';
import * as d3 from 'd3';
import d3Tip from 'd3-tip';

@Component({
  selector: 'mev-bubble-plot',
  templateUrl: './bubble-plot.component.html',
  styleUrls: ['./bubble-plot.component.scss']
})

export class TopGoBubblePlotComponent implements OnChanges {
  @Input() data: any

  dataInput = [];

  margin = {
    top: 40,
    right: 300,
    bottom: 50,
    left: 250
  }
  containerId: string = '#bubblePlot';
  imageName = 'bubble_plot';
  outerHeight: number = 650;
  outerWidth: number = window.innerWidth
  xAxis: any;
  yAxis: any;
  xScale: any;
  yScale: any;
  radiusScale: any;
  gX: any;
  gY: any;
  maxAnnotated: number = 1300;
  minAnnotated: number = 0;
  maxRadius: any;
  minRadius: any;
  colorMin: string = '#1DA1F2';
  colorMax: string = '#DF1F2D';
  minLogAnnotated: number;
  maxLogAnnotated: number;
  colors: any;
  width: number = this.outerWidth - this.margin.left - this.margin.right;
  height: number = this.outerHeight - this.margin.top - this.margin.bottom;
  radiusSize: number = this.height / 30

  ngOnChanges(): void {
    this.dataInput = this.data;
    this.setRadiusSize(this.dataInput.length);
    this.setMinMaxVariables()
  }

  //Sets the size of bubble radiius depending on the size of data on y-axis
  setRadiusSize(inputSize: number): void {
    if (inputSize === 50) {
      this.radiusSize = this.height / (this.dataInput.length + 60)
    } else if (inputSize === 25) {
      this.radiusSize = this.height / (this.dataInput.length + 30)
    } else {
      this.radiusSize = this.height / (this.dataInput.length + 20)
    }
  }

  //Set min and max variables to set axis values 
  private setMinMaxVariables(): void {
    this.minAnnotated = d3.min(this.data, d => d.annotated);
    this.maxAnnotated = d3.max(this.data, d => d.annotated);
    this.minLogAnnotated = Math.log10(this.minAnnotated);
    this.maxLogAnnotated = Math.log10(this.maxAnnotated);
    this.maxRadius = d3.max(this.data, d => (d.significant / d.annotated));
    this.minRadius = d3.min(this.data, d => (d.significant / d.annotated));
    this.createChart()
  }

  private createChart(): void {
    this.colors = d3.scaleLinear<string>()
      .domain([this.minLogAnnotated, this.maxLogAnnotated])
      .range([this.colorMin, this.colorMax])

    d3.select(this.containerId)
      .selectAll('svg')
      .remove();

    this.xScale = d3
      .scaleLinear()
      .domain([Math.log10(this.minAnnotated), Math.log10(this.maxAnnotated) * 1.05])
      .rangeRound([0, this.width])
      .nice();

    this.yScale = d3
      .scaleBand()
      .domain(this.dataInput.map(d => d.term))
      .range([0, this.height]);

    this.radiusScale = d3
      .scaleSqrt()
      .domain([this.minRadius, this.maxRadius])
      .range([3, this.radiusSize]);

    this.xAxis = d3.axisBottom(this.xScale).tickSize(-this.height);
    this.yAxis = d3.axisLeft(this.yScale).tickSize(-this.width);

    const group = d3
      .select(this.containerId)
      .append('svg')
      .attr('width', this.outerWidth)
      .attr('height', this.outerHeight)
      .append('g')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)
      .style('fill', 'none')

    group
      .append('rect')
      .attr('width', this.width)
      .attr('height', this.height)

    group
      .append('text')
      .attr("x", (this.width / 2))
      .attr("y", 0 - (this.margin.top / 2))
      .attr("text-anchor", "middle")
      .classed('chart-title', true)
      .style('fill', 'rgba(0, 0, 0, .7)')
      .text("TopGo Bubble Plot")

    //Sets X-Axis
    this.gX = group
      .append('g')
      .classed('x axis', true)
      .attr('transform', 'translate(0,' + this.height + ')')
      .call(this.xAxis);

    this.gX
      .append('text')
      .classed('label', true)
      .attr('x', this.width / 2)
      .attr('y', this.margin.bottom - 10)
      .style('text-anchor', 'end')
      .text("-Log10(P Value)");

    //Sets Y-Axis
    this.gY = group
      .append('g')
      .classed('y axis', true)
      .call(this.yAxis)

    this.gY
      .append('text')
      .classed('label', true)
      .attr('transform', 'rotate(-90)')
      .attr('y', -this.margin.left + 10)
      .attr('x', -this.height / 2)
      .attr('dy', '.71em')
      .style('text-anchor', 'middle')
      .text("GO Terms");

    //Sets Tool Tips
    const tip = d3Tip()
      .attr('class', 'd3-tip')
      .offset([-10, 0])
      .html((event, d) => {
        return "<strong>GO ID</strong>: <span class='d3-text'>" + d.go_id + "</span> <br>" +
          "<strong>Term</strong>: <span class='d3-text'>" + d.term + "</span><br>" +
          "<strong>GO ID</strong>: <span class='d3-text'>" + d.go_id + "</span> <br>" +
          "<strong>Annotated</strong>: <span class='d3-text'>" + d.annotated + "</span> <br>" +
          "<strong>Significant</strong>: <span class='d3-text'>" + d.significant / d.annotated + "</span> <br>" +
          "<strong>Classic P-Val</strong>: <span class='d3-text'>" + d.classic_pval + "</span> <br>" +
          "<strong>Elim Method P-Val</strong>: <span class='d3-text'>" + d.elim_pval + "</span> <br>"
      });
    group.call(tip);

    //Draws each Circle
    const objects = group
      .append('svg')
      .classed('objects', true)
      .attr('width', this.width)
      .attr('height', this.height);

    objects
      .selectAll('.dot')
      .data(this.dataInput)
      .enter()
      .append('circle')
      .classed('dot', true)
      .attr('cy', d => this.yScale(d.term) + this.yScale.bandwidth() / 2)
      .attr('cx', d => this.xScale(-Math.log10(d.elim_pval)))
      .attr('r', d => this.radiusScale(d.significant / d.annotated))
      .style('fill', d => {
        return this.colors(Math.log10(d.annotated));
      })
      .attr('pointer-events', 'all')
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide);

    // Color Legend
    const legendColors = [
      { name: this.maxAnnotated, color: this.colorMax },
      { name: '', color: '#b73a56' },
      { name: '', color: '#805f8e' },
      { name: '', color: '#4984c6' },
      { name: this.minAnnotated, color: this.colorMin }
    ];

    const legend = group
      .selectAll('.legend')
      .data(legendColors)
      .enter()
      .append('g')
      .classed('legend', true)
      .attr('transform', function (d, i) {
        return `translate(0,${i * 10})`;
      });

    legend
      .append('rect')
      .attr('width', 50)
      .attr('height', 10)
      .attr('x', this.width + 20)
      .attr('y', 50)
      .attr('fill', d => d.color)

    legend
      .append('text')
      .attr('x', this.width + 75)
      .attr('y', 50)
      .attr('dy', 10)
      .style('fill', '#000')
      .style('font-size', "10px")
      .attr('class', 'legend-label')
      .text(d => d.name);

    const legendTitle = group
      .append('text')
      .attr('x', this.width + 18)
      .attr('y', 40)
      .style('fill', '#000')
      .style('font-size', "14px")
      .attr('class', 'legend-title')
      .text('Annotated')


    //Circle Legend
    const minRad = this.radiusScale(this.minRadius);
    const maxRad = this.radiusScale(this.maxRadius);
    const radDiff = maxRad - minRad;

    const legendCircleContent = [
      { name: this.minRadius, radius: 4 },
      { name: (this.maxRadius - this.minRadius) * .25 + this.minRadius, radius: 7 },
      { name: (this.maxRadius - this.minRadius) * .5 + this.minRadius, radius: 10 },
      { name: this.maxRadius, radius: 15 },
    ];

    const legendCircle = group
      .selectAll('.legendCircle')
      .data(legendCircleContent)
      .enter()
      .append('g')
      .classed('legendCircle', true)
      .attr('transform', function (d, i) {
        return `translate(0,${i * 40})`;
      });

    legendCircle
      .append('circle')
      .attr('r', d => d.radius)
      .attr('cx', this.width + 40)
      .attr('cy', 200)
      .attr('fill', "rgba(0,0,0,.7")


    legendCircle
      .append('rect')
      .attr('width', 40)
      .attr('height', 40)
      .attr('x', this.width + 20)
      .attr('y', 180)
      .style("fill", "transparent")
      .style("stroke", "rgba(0,0,0,.7")
      .style("stroke-width", "1px");

    legendCircle
      .append('text')
      .attr('x', this.width + 75)
      .attr('y', 200)
      .attr('dy', ".32em")
      .style('fill', '#000')
      .style('font-size', "10px")
      .attr('class', 'legend-label')
      .text(d => d.name.toFixed(2));

    const legendTitleCicle = group
      .append('text')
      .attr('x', this.width + 18)
      .attr('y', 170)
      .style('fill', '#000')
      .style('font-size', "14px")
      .attr('class', 'legend-title')
      .text('Significant/Annotated')
  }
}
