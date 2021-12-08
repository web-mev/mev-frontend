import { Component, OnInit, Input } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'factor-ann-display',
  templateUrl: './factor-display.component.html',
  styleUrls: ['./factor-display.component.css']
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
  offset = 20;
  width = 800;
  height = 400;
  innerHeight = this.height - this.offset;

  constructor() { }

  ngOnInit(): void {
    console.log(this.data);
    this.svg = d3.select('#svg-container');
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
    this.svg.attr('transform', 'translate(' + this.offset + ',' + this.offset + ')');
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


  }

}
