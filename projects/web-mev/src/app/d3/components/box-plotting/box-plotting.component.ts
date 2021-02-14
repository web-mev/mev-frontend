import {
  Component,
  ChangeDetectionStrategy,
  Input,
  ViewChild,
  ElementRef,
  OnChanges,
  ChangeDetectorRef
} from '@angular/core';
import { AnalysesService } from '@app/features/analysis/services/analysis.service';
import { MetadataService } from '@app/core/metadata/metadata.service';
import { Utils } from '@app/shared/utils/utils';
import * as d3 from 'd3';
import d3Tip from 'd3-tip';

/**
 * Box Plotting Component
 *
 * Used for the Plotting operation (output view for the normalization methods)
 */
@Component({
  selector: 'mev-box-plotting',
  templateUrl: './box-plotting.component.html',
  styleUrls: ['./box-plotting.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class BoxPlottingComponent implements OnChanges {
  @Input() outputs;
  @ViewChild('boxPlot') svgElement: ElementRef;

  customObservationSets = [];
  customObservationSetsToPlot = [];
  resourceData = [];
  boxPlotData = [];
  boxPlotTypes = {};
  isWait = false;

  xScale; // scale functions to transform data values into the the range
  yScale;

  /* Chart settings */
  containerId = '#boxPlot';
  imageName = 'Box plot'; // file name for downloaded SVG image
  maxFeatureNumber = 80;
  precision = 2;
  margin = { top: 50, right: 150, bottom: 100, left: 40 }; // chart margins
  outerHeight = 500;
  xCat = 'key'; // field name in data for X axis
  yCat = 'Value';
  delta = 0.1; // used for X and Y axis ranges (we add delta to avoid bug when both max and min are zeros)
  boxWidth = 20; // the width of rectangular box
  tooltipOffsetX = 10; // to position the tooltip on the right side of the triggering element

  constructor(
    private apiService: AnalysesService,
    private metadataService: MetadataService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnChanges(): void {
    this.customObservationSets = this.metadataService.getCustomObservationSets();
    this.generateBoxPlot();
  }

  /**
   * Function to retrieve data for box plot
   */
  generateBoxPlot() {
    this.isWait = true;
    const resourceId = this.outputs.input_matrix;
    this.apiService.getResourceContent(resourceId).subscribe(response => {
      this.resourceData = response;
      this.reformatData();
      this.isWait = false;
      this.cdRef.detectChanges();
      this.createChart();
    });
  }

  /**
   * Function to prepare data for box plot
   */
  reformatData() {
    if (this.resourceData.length) {
      this.boxPlotTypes = {};
      if (this.customObservationSetsToPlot.length) {
        this.customObservationSetsToPlot.forEach(set => {
          this.boxPlotTypes[set.name] = {
            label: set.name,
            yCat: set.name,
            color: set.color,
            samples: set.elements.map(el => el.id)
          };
        });
      } else {
        this.boxPlotTypes['All samples'] = {
          label: 'All samples',
          yCat: 'All samples',
          color: '#f40357',
          samples: Object.keys(this.resourceData[0].values)
        };
      }

      if (this.outputs.features?.elements?.length) {
        const selectedFeatures = this.outputs.features.elements.map(
          el => el.id
        );
        this.resourceData = this.resourceData.filter(el =>
          selectedFeatures.includes(el.rowname)
        );
      }

      this.resourceData = this.resourceData.slice(0, this.maxFeatureNumber);
      const countsFormatted = this.resourceData.map(elem => {
        const newElem = { key: elem.rowname };
        Object.keys(this.boxPlotTypes).forEach(key => {
          const numbers = this.boxPlotTypes[key].samples.reduce(
            (acc, cur) => [...acc, elem.values[cur]],
            []
          );
          newElem[this.boxPlotTypes[key].yCat] = Utils.getBoxPlotStatistics(
            numbers
          );
        });
        return newElem;
      });
      this.boxPlotData = countsFormatted;
    }
  }

  /**
   * Function to create box plot
   */
  createChart(): void {
    const outerWidth = this.svgElement.nativeElement.offsetWidth;
    const outerHeight = this.outerHeight;
    const width = outerWidth - this.margin.left - this.margin.right;
    const height = outerHeight - this.margin.top - this.margin.bottom;

    const data = this.boxPlotData;

    d3.select(this.containerId)
      .selectAll('svg')
      .remove();

    const svg = d3
      .select(this.containerId)
      .append('svg')
      .attr('width', outerWidth)
      .attr('height', outerHeight)
      .append('g')
      .attr(
        'transform',
        'translate(' + this.margin.left + ',' + this.margin.top + ')'
      )
      .style('fill', 'none');

    // Tooltip
    const tooltipOffsetX = this.tooltipOffsetX;
    const tip = d3Tip()
      .attr('class', 'd3-tip')
      .offset([-10, 0])
      .html((event, d) => {
        // if it is a hover over an individual point, show the value
        if (d !== Object(d)) return 'Value: ' + d.toFixed(this.precision);

        // if it is a hover over a box plot, show table with basic statistic values
        const htmlTable =
          '<table><thead><th></th>' +
          Object.keys(this.boxPlotTypes)
            .map(key => '<th>' + this.boxPlotTypes[key].label + '</th>')
            .join('') +
          '<thead>' +
          '<tr><td>Q1</td>' +
          Object.keys(this.boxPlotTypes)
            .map(
              key =>
                '<td>' +
                d[this.boxPlotTypes[key].yCat].q1.toFixed(this.precision) +
                '</td>'
            )
            .join('') +
          '</tr>' +
          '<tr><td>Q2</td>' +
          Object.keys(this.boxPlotTypes)
            .map(
              key =>
                '<td>' +
                d[this.boxPlotTypes[key].yCat].median.toFixed(this.precision) +
                '</td>'
            )
            .join('') +
          '</tr>' +
          '<tr><td>Q3</td>' +
          Object.keys(this.boxPlotTypes)
            .map(
              key =>
                '<td>' +
                d[this.boxPlotTypes[key].yCat].q3.toFixed(this.precision) +
                '</td>'
            )
            .join('') +
          '</tr>' +
          '<tr><td>IQR</td>' +
          Object.keys(this.boxPlotTypes)
            .map(
              key =>
                '<td>' +
                d[this.boxPlotTypes[key].yCat].iqr.toFixed(this.precision) +
                '</td>'
            )
            .join('') +
          '</tr>' +
          '<tr><td>MIN</td>' +
          Object.keys(this.boxPlotTypes)
            .map(
              key =>
                '<td>' +
                d[this.boxPlotTypes[key].yCat].min.toFixed(this.precision) +
                '</td>'
            )
            .join('') +
          '</tr>' +
          '<tr><td>MAX</td>' +
          Object.keys(this.boxPlotTypes)
            .map(
              key =>
                '<td>' +
                d[this.boxPlotTypes[key].yCat].max.toFixed(this.precision) +
                '</td>'
            )
            .join('') +
          '</tr>' +
          '</table>';
        return '<b>' + d[this.xCat] + '</b><br>' + htmlTable;
      });
    svg.call(tip);

    svg
      .append('rect')
      .attr('width', width)
      .attr('height', height)
      .style('fill', 'transparent');

    /* Setting up X-axis and Y-axis*/
    this.xScale = d3
      .scaleBand()
      .rangeRound([0, width])
      .domain(data.map(d => d.key))
      .paddingInner(1)
      .paddingOuter(0.5);

    this.yScale = d3.scaleLinear().rangeRound([height, 0]);

    const maxArr = Object.keys(this.boxPlotTypes).map(key =>
      d3.max(data, d => <number>d[this.boxPlotTypes[key].yCat].max || 0)
    );
    const minArr = Object.keys(this.boxPlotTypes).map(key =>
      d3.min(data, d => <number>d[this.boxPlotTypes[key].yCat].min || 0)
    );
    const yMax = Math.max(...maxArr);
    const yMin = Math.min(...minArr);
    const yRange = yMax - yMin + this.delta; // add delta to avoid bug when both max and min are zeros

    this.yScale.domain([
      yMin - yRange * this.delta,
      yMax + yRange * this.delta
    ]);

    svg
      .append('g')
      .attr('transform', 'translate(0,' + height + ')')
      .attr('class', 'x-axis')
      .call(d3.axisBottom(this.xScale))
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)');

    svg.append('g').call(d3.axisLeft(this.yScale));

    // Box plots
    Object.keys(this.boxPlotTypes).forEach((key, i) => {
      const yCatProp = this.boxPlotTypes[key].yCat;
      const color = this.boxPlotTypes[key].color;

      // Main vertical line
      svg
        .selectAll('.vertLines')
        .data(data)
        .enter()
        .append('line')
        .attr(
          'x1',
          (d: any) =>
            this.xScale(d[this.xCat]) + (1.2 * i - 0.6) * this.boxWidth
        )
        .attr(
          'x2',
          (d: any) =>
            this.xScale(d[this.xCat]) + (1.2 * i - 0.6) * this.boxWidth
        )
        .attr('y1', (d: any) => this.yScale(d[yCatProp].min))
        .attr('y2', (d: any) => this.yScale(d[yCatProp].max))
        .attr('stroke', 'black')
        .style('width', d => 10);

      svg
        .selectAll('.boxes')
        .data(data)
        .enter()
        .append('rect')
        .attr(
          'x',
          d => this.xScale(d[this.xCat]) + (1.2 * i - 1.1) * this.boxWidth
        )
        .attr('y', d => this.yScale(d[yCatProp].q3))
        .attr(
          'height',
          d => this.yScale(d[yCatProp].q1) - this.yScale(d[yCatProp].q3)
        )
        .attr('width', d => this.boxWidth)
        .attr('stroke', 'black')
        .style('fill', color)
        .attr('pointer-events', 'all')
        .on('mouseover', function(mouseEvent: any, d) {
          tip.show(mouseEvent, d, this);
          tip.style('left', mouseEvent.x + tooltipOffsetX + 'px');
        })
        .on('mouseout', tip.hide);

      // Medians
      svg
        .selectAll('.medianLines')
        .data(data)
        .enter()
        .append('line')
        .attr('x1', d => {
          if (d[yCatProp].median !== undefined)
            return this.xScale(d[this.xCat]) + (1.2 * i - 1.1) * this.boxWidth;
          return 0;
        })
        .attr('x2', d => {
          if (d[yCatProp].median !== undefined)
            return this.xScale(d[this.xCat]) + (1.2 * i - 0.1) * this.boxWidth;
          return 0;
        })
        .attr('y1', d => this.yScale(d[yCatProp].median))
        .attr('y2', d => this.yScale(d[yCatProp].median))
        .attr('stroke', 'black')
        .style('width', d => 80);
    });

    // Legend
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
      .attr('transform', function(d, i) {
        return 'translate(0,' + i * 20 + ')';
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
      .attr('class', 'legend-label')
      .text(d => d.label);
  }

  /**
   * Function is triggered when resizing the chart
   */
  onResize(event) {
    this.createChart();
  }

  /**
   * Function is triggered when the user checks/unchecks custom observation sets
   */
  onObservationCheck(e) {
    const sampleSet = e.source.id;
    const foundSet = this.customObservationSets.find(
      el => el.name === sampleSet
    );

    if (e.checked) {
      this.customObservationSetsToPlot.push(foundSet);
    } else {
      this.customObservationSetsToPlot = this.customObservationSetsToPlot.filter(
        set => set.name !== foundSet.name
      );
    }
    this.reformatData();
    this.createChart();
  }
}
