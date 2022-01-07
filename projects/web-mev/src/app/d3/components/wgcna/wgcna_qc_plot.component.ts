import { Component, ViewChild, Inject, ElementRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import * as d3 from 'd3';

@Component({
  selector: 'wgcna-qc',
  templateUrl: './wgcna_qc_plot.component.html',
  styleUrls: ['./wgcna_qc_plot.component.scss']
})
export class WGCNAQcPlotComponent {

  @ViewChild('wgcnaPlot') svgElement: ElementRef;
  containerId = '#wgcnaPlot'
  outerWidth = 300;
  outerHeight = 200;
  margin = {
      left: 70,
      top: 40,
      bottom: 40,
      right: 20
  };
  xScale; 
  yScale;

  constructor(
    private formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<WGCNAQcPlotComponent>,
    @Inject(MAT_DIALOG_DATA) public data
  ) {}

  ngOnInit(): void {
    console.log(this.data);
    this.makePlot();
  }

  makePlot(): void {

    const xData: number[] = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30];
    const yData = [-0.395209276564604,0.000181464794426609,0.319297262771095,0.601067168394457,0.7695023948817,0.876964416299025,0.88701899855348,0.906664050360751,0.902306458185746,0.905494944436844,0.897228524058429,0.863385570441117,0.339675408249748,0.342288977524127,0.345117515314592,0.908110276016868,0.910241957941012,0.914723879531402,0.913025842750759,0.897654002402207,0.900894108035066,0.905244339078664,0.908473377611907,0.939843040492537,0.938145815134975,0.921153063077473,0.926065094240271,0.958738511022182,0.96491898558337,0.967627246072219];
    let finalData = [];
    for (let i=0; i<xData.length; i++){
        finalData.push(
            {
                x: xData[i],
                y: yData[i]
            }
        );
    }
    const beta = 5;

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

    const xMax = d3.max(xData);
    const yMax = d3.max(yData);

    /* Setting up X-axis and Y-axis*/
    this.xScale = d3
      .scaleLinear()
      .rangeRound([0, width])
      .nice()
      .domain([0, xMax]);

    this.yScale = d3
      .scaleLinear()
      .rangeRound([height, 0])
      .nice()
      .domain([0, yMax]);

    let xAxis = d3.axisBottom(this.xScale);
    let yAxis = d3.axisLeft(this.yScale);

    let gX = group
      .append('g')
      .classed('x axis', true)
      .attr('transform', 'translate(0,' + height + ')')
      .call(xAxis);

    gX
      .append('text')
      .classed('label', true)
      .attr('x', width/2)
      .attr('y', this.margin.bottom)
      //.style('text-anchor', 'end')
      .text('Beta');


    let gY = group
      .append('g')
      .classed('y axis', true)
      .call(yAxis);

    gY
      .append('text')
      .classed('label', true)
      .attr('transform', 'rotate(-90)')
      .attr('y', -(this.margin.left - 20))
      .attr('x', height)
      .attr('dy', '.71em')
      .style('text-anchor', 'end')
      .text('Y');

    let ptsGroup = group.append('g');
    ptsGroup
      .selectAll('.dot')
      .data(finalData)
      .enter()
      .append('circle')
      .classed('dot', true)
      .attr('r', 7)
      .attr(
        'transform',
        d =>
          'translate(' +
          this.xScale(d.x) +
          ',' +
          this.yScale(d.y) +
          ')'
      )
      .style('fill', 'grey');
      console.log('here...');
  }

  submit() {
    // empty stuff
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
