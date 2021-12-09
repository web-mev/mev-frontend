import { Component, OnInit, Input } from '@angular/core';
import * as d3 from 'd3';
import d3Tip from 'd3-tip';
import { Utils } from '@app/shared/utils/utils';

@Component({
  selector: 'factor-ann-display',
  templateUrl: './factor-display.component.html',
  styleUrls: ['./factor-display.component.scss']
})
export class FactorDisplayComponent implements OnInit {

  @Input() fieldName: string = '';
  @Input() data: any[] = [];

  binData;
  svg;
  barsGrp;
  xAxisLabelGrp;
  yAxisLabelGrp;
  xScale;
  yScale;
  bandwidth;
  maxY;
  containerId = '#factor-display-wrapper'
  offset = 40;
  width = 800;
  height = 400;
  innerHeight = this.height - this.offset;

  constructor() { }

  ngOnInit(): void {
    console.log(this.data);
    //this.svg = d3.select('#svg-container');
    this.countBins();
    this.setupPlot();
    this.makeBarPlot();
  }

  countBins() {
    let countMap = new Map<string, number>();
    for(let x of this.data){
      if(countMap.has(x)){
        countMap.set(x, countMap.get(x) + 1);
      } else {
        countMap.set(x, 1);
      }
    }
    this.binData = [];
    for(let[k,v] of countMap.entries()){
      this.binData.push(
        {
          key: k,
          count: v
        }
      );
    }
  }

  setupPlot(){
    this.svg = d3
      .select(this.containerId)
      .append('svg')
      .attr('width', outerWidth)
      .attr('height', outerHeight)
      .append('g')
      .attr(
        'transform',
        'translate(' + this.offset + ',' + this.offset + ')'
      )
      .style('fill', 'none');
    //this.svg.attr('transform', 'translate(' + this.offset + ',' + this.offset + ')');
    this.barsGrp = this.svg.append('g');
    this.xAxisLabelGrp = this.svg.append('g');
    this.yAxisLabelGrp = this.svg.append('g');

    this.maxY = d3.max(this.binData.map(d=>d.count));
    console.log(this.maxY);
    let xCats = this.binData.map( d=> d.key)
    this.xScale = d3.scaleBand()
        .domain(xCats)
        .range([this.offset, this.width-this.offset])
        .paddingOuter(0.1)
        .paddingInner(0.5);

    this.bandwidth = this.xScale.bandwidth();

    this.yScale = d3.scaleLinear()
        .domain([0, 1.1 * this.maxY])
        .range([this.innerHeight,0]);

    this.xAxisLabelGrp
      .attr('transform', "translate(0," + (this.innerHeight) + ")")
      .call(d3.axisBottom(this.xScale));

      this.yAxisLabelGrp
      .attr('transform', "translate(" + this.offset + ",0)")
      .call(d3.axisLeft(this.yScale));
}

  makeBarPlot(){
    console.log(this.binData);

    const tip = d3Tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html((event, d) => {
      console.log(event);
      console.log(d);
      return (
        '<span>' + d.key + ':' + d.count + '</span>'
      );
    });
  this.svg.call(tip);

    this.barsGrp
      .selectAll('rect')
      .data(this.binData)
      .enter()
      .append('rect')
      .attr('x', d=>this.xScale(d.key))
      .attr('y', d=> {
        return (this.yScale(d.count))
      })
      .attr('height', d=>{
        console.log(d.count);
        console.log(this.yScale(d.count))
        return this.innerHeight - this.yScale(d.count);
      })
      .attr('width', this.bandwidth)
      .attr('fill', d=>Utils.getRandomColor())
      .attr('pointer-events', 'all')
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide);


  }

}
