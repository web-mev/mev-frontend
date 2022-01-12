import { 
  Component, 
  ViewChild,  
  ElementRef, 
  Input, 
  OnInit, 
  OnChanges
} from '@angular/core';
import { AnalysesService } from '@app/features/analysis/services/analysis.service';
import { MatDialog } from '@angular/material/dialog';
import { WgcnaElbowDialogComponent } from './wgcna_elbow_example.component';

import * as d3 from 'd3';
import d3Tip from 'd3-tip';

@Component({
  selector: 'wgcna-qc',
  templateUrl: './wgcna_qc_plot.component.html',
  styleUrls: ['./wgcna_qc_plot.component.scss']
})
export class WGCNAQcPlotComponent implements OnInit, OnChanges{

  @Input() resourceId;
  @ViewChild('wgcnaPlot') svgElement: ElementRef;
  containerId = '#wgcnaPlot'
  outerWidth = 700;
  outerHeight = 500;
  margin = {
      left: 70,
      top: 40,
      bottom: 40,
      right: 20
  };
  xMax;
  yMin;
  yMax;
  xScale;
  yScale;

  constructor(private analysesService: AnalysesService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.getDataAndPlot();
  }

  ngOnChanges(){
    this.getDataAndPlot();
  }

  getDataAndPlot(){
    this.analysesService
    .getResourceContent(
      this.resourceId
    ).subscribe(response => {
      this.makePlot(response);
    });
  }

  openExampleDialog(){
    let dialogRef = this.dialog.open(WgcnaElbowDialogComponent);
    dialogRef.afterClosed().subscribe();
  }

  makePlot(data: any): void {

    // data is formatted as:
    // {x: number[], y: number[], beta: number}

    // clear any existing plot
    d3.select(this.containerId)
      .selectAll('svg')
      .remove();

    const group = d3
        .select(this.containerId)
        .append('svg')
        .attr('width', this.outerWidth)
        .attr('height', this.outerHeight)
        .append('g')
        .attr(
            'transform',
            'translate(' + this.margin.left + ',' + this.margin.top + ')'
        )
        .style('fill', 'none')

    const width = this.outerWidth - this.margin.left - this.margin.right;
    const height = this.outerHeight - this.margin.top - this.margin.bottom;

    this.xMax = d3.max(data['x']);
    this.yMax = d3.max(data['y']);
    this.yMin = d3.min(data['y']);

    let reformattedData: any = [];
    for(let idx=0; idx<data['x'].length; idx++){
        let x = data['x'][idx];
        let y = data['y'][idx];
        reformattedData.push({
            x: x,
            y: y
        })
    }

    // Tooltip for the discrete points
    const ptTip = d3Tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html((event, d) => {
            return (
                '(' + d.x + ', ' + d.y.toFixed(3)+ ')'
            );
        });
    group.call(ptTip);

    // tooltip for the 'beta' line
    const betaTip = d3Tip()
        .attr('class', 'd3-tip')
        .direction('e')
        .offset([0,20])
        .html((event, d) => {
            return (
                "Beta*: " + data['beta']
            );
        });
    group.call(betaTip);

    /* Setting up X-axis and Y-axis*/
    this.xScale = d3
      .scaleLinear()
      .rangeRound([0, width])
      .nice()
      .domain([0, this.xMax]);

    this.yScale = d3
      .scaleLinear()
      .rangeRound([height, 0])
      .nice()
      .domain([this.yMin, this.yMax]);

    let xAxis = d3.axisBottom(this.xScale);
    let yAxis = d3.axisLeft(this.yScale);

    let gX = group
      .append('g')
      .classed('x axis', true)
      .attr('transform', 'translate(0,' + height + ')')
      .call(xAxis);
    gX
      .append('text')
      .attr('x', width/2)
      .attr('y', (this.margin.bottom - 10))
      .style('text-anchor', 'middle')
      .style('font-size', '2em')
      .attr('dy', '0.5em')
      .style('fill', 'black')
      .text('Beta');


    let gY = group
      .append('g')
      .classed('y axis', true)
      .call(yAxis);
    gY
      .append('text')
      .classed('label', true)
      .attr('transform', 'rotate(-90)')
      .attr('y', -(this.margin.left - 30))
      .attr('x', -(height/2))
      .attr('dy', '.5em')
      .style('font-size', '2em')
      .style('text-anchor', 'middle')
      .style('fill', 'black')
      .text('Y');

      // vertical line marking the "beta" that was used
      // Note that we put this before the actual data points
      // so the z-ordering is sensible (e.g. the vertical line
      // doesn't obscure the actual plot points)
      group.append("line")
        .attr("x1", this.xScale(data['beta'])) 
        .attr("y1", this.yScale(this.yMin))
        .attr("x2", this.xScale(data['beta']))
        .attr("y2", this.yScale(this.yMax))
        .style("stroke-width", 2)
        .style("stroke", "grey")
        .attr("stroke-dasharray", "10,10")
        .style("fill", "none")
      // this invisible line provides a fatter hover
      // target which makes it easier for the mouse to
      // hit
      group.append("line")
        .attr("x1", this.xScale(data['beta'])) 
        .attr("y1", this.yScale(this.yMin))
        .attr("x2", this.xScale(data['beta']))
        .attr("y2", this.yScale(this.yMax))
        .attr('pointer-events', 'all')
        .style("stroke-width", 15)
        .style("visibility", "hidden")
        .style("fill", "none")
        .on('mouseover', betaTip.show)
        .on('mouseout', betaTip.hide);

    let lineGroup = group.append('g');
    lineGroup
        .append("path")
        .datum(reformattedData)
        .attr("fill", "none")
        .attr("stroke", "#69b3a2")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
        .x( d=> this.xScale(d['x']))
        .y( d=> this.yScale(d['y']))
        )

    let ptsGroup = group.append('g');
    ptsGroup
      .selectAll('.dot')
      .data(reformattedData)
      .enter()
      .append('circle')
      .classed('dot', true)
      .attr('r', 7)
      .attr(
        'transform',
        d =>
          'translate(' +
          this.xScale(d['x']) +
          ',' +
          this.yScale(d['y']) +
          ')'
      )
      .style('fill', 'grey')
      .on('mouseover', ptTip.show)
      .on('mouseout', ptTip.hide);
  }

}
