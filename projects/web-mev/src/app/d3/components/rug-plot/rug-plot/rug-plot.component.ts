import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ElementRef,
  ViewChild,
  Input
} from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'mev-rug-plot',
  templateUrl: './rug-plot.component.html',
  styleUrls: ['./rug-plot.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RugPlotComponent implements OnInit {
  @ViewChild('chart') chart: ElementRef;

  _plotData = [];

  get plotData() {
    return this._plotData;
  }
  @Input('plotData')
  set plotData(value) {
    this._plotData = value;
    if (Object.keys(value).length === 0 && value.constructor === Object) {
      return;
    }
    //this.startGraphic();
  }
  ngAfterViewInit() {
    this.startGraphic();
  }
  constructor() {}

  ngOnInit(): void {}

  startGraphic() {
    const plotData = this.plotData;
    //const width = 300
    const margin = { top: 10, right: 20, bottom: 10, left: 20 }; // chart margins
    const outerWidth = this.chart.nativeElement.offsetWidth;
    const outerHeight = 100;
    const width = outerWidth - margin.left - margin.right;
    const height = outerHeight - margin.top - margin.bottom;

    const xMax = d3.max(plotData);
    const xMin = d3.min(plotData);
    const x = d3
      .scaleLinear()
      .rangeRound([0, width])
      .nice()
      .domain([xMin, xMax]);

    const chart = d3
      .select(this.chart.nativeElement)
      .append('svg')
      .attr('width', outerWidth)
      .attr('height', outerHeight)
      // .attr('x', 0)
      // .attr('y', 0)
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    //.append('g')

    const bar = chart
      .selectAll('g')
      .data(plotData)
      .enter()
      .append('g');

    bar
      .append('rect')
      .attr('x', d => x(d))
      .attr('width', 1)
      .attr('y', 10)
      .attr('height', 30);

    const xAxis = d3.axisBottom(x).ticks(3); //.tickSize(50);

    chart
      .append('g')
      .classed('x axis', true)
      .attr('transform', 'translate(0, 40)')
      //.style('fill', 'transparent')
      .call(xAxis);
  }
}
