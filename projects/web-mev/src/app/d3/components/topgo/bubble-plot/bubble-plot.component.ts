import { Component, Input, HostListener, OnChanges } from '@angular/core';
import * as d3 from 'd3'; //NOTE: maybe import individual components??
import d3Tip from 'd3-tip';

@Component({
  selector: 'mev-bubble-plot',
  templateUrl: './bubble-plot.component.html',
  styleUrls: ['./bubble-plot.component.scss']
})

export class TopGoBubblePlotComponent implements OnChanges {
  @Input() data

  dataInput = [];

  margin = {
    top: 50,
    right: 300,
    bottom: 50,
    left: 250
  }
  containerId = '#bubblePlot';
  outerHeight = 500;
  outerWidth = window.innerWidth
  xAxis: any;
  yAxis: any;
  xScale: any;
  yScale: any;
  radiusScale: any;
  xCat: any;
  yCat: any;
  gX: any;
  gY: any;
  xVariance: any;
  yVariance: any;
  precision = 2;
  maxAnnotated: any = 1300;
  minAnnotated: any = 0;
  maxRadius: any;
  minRadius: any;
  pointCat: any;
  colorMin: string = '#1DA1F2';
  colorMax: string = '#DF1F2D';
  sampleSetColors = [];

  colors = d3.scaleLinear<string>()
    .domain([this.minAnnotated, this.maxAnnotated])
    .range([this.colorMin, this.colorMax])

  ngOnChanges(): void {
    this.dataInput = this.data;
    this.updateColorRange()
  }

  //might not need this??
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    outerWidth = window.innerWidth;
    this.createChart()
  }

  private updateColorRange(): void {
    this.minAnnotated = d3.min(this.data, d => d.annotated);
    this.maxAnnotated = d3.max(this.data, d => d.annotated);
    this.maxRadius = d3.max(this.data, d => (d.significant / d.annotated));
    this.minRadius = d3.min(this.data, d => (d.significant / d.annotated));
    this.createChart()
  }

  private createChart(): void {
    const outerWidth = this.outerWidth;
    const outerHeight = this.outerHeight;
    const width = outerWidth - this.margin.left - this.margin.right;
    const height = outerHeight - this.margin.top - this.margin.bottom;
    const data = this.dataInput;

    d3.select(this.containerId)
      .selectAll('text')
      .remove();

    this.xScale = d3
      .scaleLinear()
      .domain([Math.log(this.minAnnotated), Math.log(this.maxAnnotated)])
      .rangeRound([0, width]) //vs rangeRound()
      .nice();

    this.yScale = d3
      .scaleBand()
      .domain(data.map(d => d.term))
      .rangeRound([0, height]);

    this.radiusScale = d3
      .scaleSqrt()
      .domain([this.minRadius, this.maxRadius])
      .range([3, height / (this.dataInput.length + 15)]);

    this.xAxis = d3.axisBottom(this.xScale).tickSize(-height);
    this.yAxis = d3.axisLeft(this.yScale).tickSize(-width);

    const group = d3
      .select(this.containerId)
      .append("text")
      .attr("x", (width / 2))
      .attr("y", 0 - (this.margin.top / 2))
      .attr("text-anchor", "middle")
      .classed('chart-title', true)
      .style("font-size", "16px")
      .text("TopGo Bubble Plot")
      .append('svg')
      .attr('width', outerWidth)
      .attr('height', outerHeight)
      .append('g')
      .attr(
        'transform',
        'translate(' + this.margin.left + ',' + this.margin.top + ')'
      )
      .style('fill', 'none')

    group
      .append('rect')
      .attr('width', width)
      .attr('height', height)

    this.gX = group
      .append('g')
      .classed('x axis', true)
      .attr('transform', 'translate(0,' + height + ')')
      .call(this.xAxis);

    this.gX
      .append('text')
      .classed('label', true)
      .attr('x', width / 2)
      .attr('y', this.margin.bottom - 10)
      .style('text-anchor', 'end')
      .text("-Log(P Value)");

    this.gY = group
      .append('g')
      .classed('y axis', true)
      .call(this.yAxis);

    this.gY
      .append('text')
      .classed('label', true)
      .attr('transform', 'rotate(-90)')
      .attr('y', -this.margin.left + 10)
      .attr('x', -height / 2)
      .attr('dy', '.71em')
      .style('text-anchor', 'middle')
      .text("GO Terms");

    const tip = d3Tip()
      .attr('class', 'd3-tip')
      .offset([-10, 0])
      .html((event, d) => {
        return "<strong>GO ID</strong>: <span>" + d.go_id + "</span> <br>" +
          "<strong>Term</strong>: <span>" + d.term + "</span><br>" +
          "<strong>GO ID</strong>: <span>" + d.go_id + "</span> <br>" +
          "<strong>Annotated</strong>: <span>" + d.annotated + "</span> <br>" +
          "<strong>Significant</strong>: <span>" + d.significant / d.annotated + "</span> <br>" +
          "<strong>Classic P-Val</strong>: <span>" + d.classic_pval + "</span> <br>" +
          "<strong>Elim Method P-Val</strong>: <span>" + d.elim_pval + "</span> <br>"
      });
    group.call(tip);

    const objects = group
      .append('svg')
      .classed('objects', true)
      .attr('width', width)
      .attr('height', height);

    objects
      .selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
      .classed('dot', true)
      .attr('cy', d => this.yScale(d.term) + this.yScale.bandwidth() / 2)
      .attr('cx', d => this.xScale(-Math.log(d.elim_pval)))
      .attr('r', d => this.radiusScale(d.significant / d.annotated))
      .style('fill', d => {
        return this.colors(d.annotated);
      })
      .attr('pointer-events', 'all')
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide);

    // Legend
    const legendColors = [
      { name: this.maxAnnotated, color: this.colorMax },
      { name: '', color: this.colors((this.maxAnnotated - this.minAnnotated) * .75) },
      { name: '', color: this.colors((this.maxAnnotated - this.minAnnotated) * .5) },
      { name: '', color: this.colors((this.maxAnnotated - this.minAnnotated) * .25) },
      { name: this.minAnnotated, color: this.colorMin }
    ];

    const legend = group
      .selectAll('.legend')
      .data(legendColors)
      .enter()
      .append('g')
      .classed('legend', true)
      .attr('transform', function (d, i) {
        return 'translate(0,' + i * 10 + ')';
      });

    legend
      .append('rect')
      .attr('width', 50)
      .attr('height', 10)
      .attr('x', width + 20)
      .attr('y', 50)
      .attr('fill', d => d.color)

    legend
      .append('text')
      .attr('x', width + 75)
      .attr('y', 50)
      .attr('dy', 10)
      .style('fill', '#000')
      .style('font-size', "10px")
      .attr('class', 'legend-label')
      .text(d => d.name);

    const minRad = this.radiusScale(this.minRadius);
    const maxRad = this.radiusScale(this.maxRadius);
    const radDiff = maxRad - minRad;

    const legendCircleContent = [
      { name: this.minRadius, radius: minRad },
      { name: (this.maxRadius - this.minRadius)*.25 + this.minRadius, radius: minRad + radDiff * .25 },
      { name: (this.maxRadius - this.minRadius)*.5 + this.minRadius, radius: minRad + radDiff * .5 },
      { name: (this.maxRadius - this.minRadius)*.75 + this.minRadius, radius: minRad + radDiff * .75 },
      { name: this.maxRadius, radius: maxRad },
    ];

    const legendCircle = group
      .selectAll('.legendCircle')
      .data(legendCircleContent)
      .enter()
      .append('g')
      .classed('legendCircle', true)
      .attr('transform', function (d, i) {
        return 'translate(0,' + i *30 + ')';
      });

    legendCircle
      .append('circle')
      .attr('r', d => d.radius)
      .attr('cx', width + 40)
      .attr('cy', 200)
      .attr('fill', "rgba(0,0,0,.7")

    legendCircle
      .append('text')
      .attr('x', width + 75)
      .attr('y', 200)
      .attr('dy', ".32em")
      .style('fill', '#000')
      .style('font-size', "10px")
      .attr('class', 'legend-label')
      .text(d => d.name.toFixed(2));

  }
}
