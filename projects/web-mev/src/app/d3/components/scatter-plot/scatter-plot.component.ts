import {
  Component,
  ChangeDetectionStrategy,
  Input,
  OnChanges
} from '@angular/core';
import * as d3 from 'd3';
import d3Tip from 'd3-tip';
import { LclStorageService } from '@app/core/local-storage/lcl-storage.service';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AddSampleSetComponent } from '../dialogs/add-sample-set/add-sample-set.component';

@Component({
  selector: 'mev-scatter-plot',
  templateUrl: './scatter-plot.component.html',
  styleUrls: ['./scatter-plot.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class ScatterPlotComponent implements OnChanges {
  @Input() pcaData;
  chartViewMode = 'selectionMode';
  precision = 2;

  selectedSamples = [];
  selectedSamplesStatusTxt: string;
  pcaAxes = [];

  margin = { top: 50, right: 300, bottom: 50, left: 50 };
  outerWidth = 1050;
  outerHeight = 500;

  width;
  height;

  xCat; // field name in data for X axis (it's 'pc1' for default view)
  yCat; // field name in data for Y axis (it's 'pc2' for default view)

  xCatIndex: number; // order of prinicipal component for X axis (0 for default view)
  yCatIndex: number; // order of prinicipal component for Y axis (1 for default view)

  colorCat = 'sample';

  xVariance; // explained variance for X axis PC
  yVariance; // explained variance for Y axis PC

  x;
  y;

  xAxis;
  yAxis;

  gX;
  gY;
  xMax;
  xMin;
  yMax;
  yMin;

  zoomListener;
  brushListener;

  zoomTransform;
  objects;

  svg;

  constructor(
    private storage: LclStorageService,
    private route: ActivatedRoute,
    public dialog: MatDialog
  ) {
    this.width = outerWidth - this.margin.left - this.margin.right;
    this.height = outerHeight - this.margin.top - this.margin.bottom;
  }

  ngOnChanges(): void {
    if (!this.pcaData) {
      return;
    }

    const headers = this.pcaData.columns;
    const values = this.pcaData.values;
    const samples = this.pcaData.rows;

    const pcaPoints = values.map(point => {
      const newPoint = {};
      headers.forEach((header, idx) => (newPoint[header] = point[idx]));
      return newPoint;
    });

    samples.forEach(
      (sampleName, idx) => (pcaPoints[idx]['sample'] = sampleName)
    );
    const pcaDataFormatted = {
      pcaPoints: pcaPoints,
      axisInfo: this.pcaData.pca_explained_variances
    };

    this.pcaData = pcaDataFormatted;

    // initialise variables for X and Y axes if undefined
    // by default use the 1st principal component for X axis and the 2nd for Y axis
    if (!this.xCat && !this.yCat) {
      this.updateXCatAndVarianceByIndex(0);
      this.updateYCatAndVarianceByIndex(1);
    }

    this.createChart();
  }

  /**
   * Function is triggered when switching between Zooming and Selection view modes
   */
  onChartViewChange(chartViewMode) {
    this.chartViewMode = chartViewMode;

    if (chartViewMode === 'selectionMode') {
      // activate brushing
      d3.select('svg').call(this.brushListener);

      // deactivate zooming
      d3.select('svg').call(
        d3
          .zoom()
          .scaleExtent([0, 700])
          .on('zoom', null)
      );
    }
    if (chartViewMode === 'zoomMode') {
      d3.select('svg').call(this.zoomListener);

      d3.select('svg').call(
        d3
          .brush()
          .extent([
            [0, 0],
            [0, 0]
          ]) // reset the brush area
          .on('start', null) // deactivate brushing feature
      );
    }
  }

  /**
   * Function to create scatter plot
   */
  private createChart(): void {
    d3.selectAll('svg').remove();
    const data = this.pcaData.pcaPoints;

    this.x = d3
      .scaleLinear()
      .rangeRound([0, this.width])
      .nice();

    this.y = d3
      .scaleLinear()
      .rangeRound([this.height, 0])
      .nice();

    const delta = 0.1;
    this.xMax = d3.max(data, d => d[this.xCat]);
    this.xMin = d3.min(data, d => d[this.xCat]);
    this.yMax = d3.max(data, d => d[this.yCat]);
    this.yMin = d3.min(data, d => d[this.yCat]);

    const xRange = this.xMax - this.xMin + delta; // add delta to avoid bug when both max and min are zeros
    const yRange = this.yMax - this.yMin + delta;

    this.x.domain([this.xMin - xRange * delta, this.xMax + xRange * delta]);
    this.y.domain([this.yMin - yRange * delta, this.yMax + yRange * delta]);

    this.xAxis = d3.axisBottom(this.x).tickSize(-this.height);

    this.yAxis = d3.axisLeft(this.y).tickSize(-this.width);

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Add the Zoom and panning feature
    this.zoomListener = d3
      .zoom()
      .scaleExtent([0, 700])
      .on('zoom', event => {
        this.zoomHandler(event);
      });

    this.svg = d3
      .select('#scatterPlot')
      .append('svg')
      .attr('width', outerWidth)
      .attr('height', outerHeight)
      .append('g')
      .attr(
        'transform',
        'translate(' + this.margin.left + ',' + this.margin.top + ')'
      )
      .style('fill', 'none')
      .call(this.zoomListener);

    // Add the brush feature
    this.brushListener = d3
      .brush()
      .extent([
        [this.margin.left, this.margin.top],
        [this.margin.left + this.width, this.margin.top + this.height]
      ])
      .on('start end', event => this.brushHandler(event));

    // Tooltip
    const tip = d3Tip()
      .attr('class', 'd3-tip')
      .offset([-10, 0])
      .html((event, d) => {
        return (
          d[this.colorCat] +
          '<br>' +
          this.xCat +
          ': ' +
          d[this.xCat].toFixed(this.precision) +
          '<br>' +
          this.yCat +
          ': ' +
          d[this.yCat].toFixed(this.precision)
        );
      });
    this.svg.call(tip);

    this.svg
      .append('rect')
      .attr('width', this.width)
      .attr('height', this.height)
      .style('fill', 'transparent');

    this.gX = this.svg
      .append('g')
      .classed('x axis', true)
      .attr('transform', 'translate(0,' + this.height + ')')
      .call(this.xAxis);

    this.gX
      .append('text')
      .classed('label', true)
      .attr('x', this.width)
      .attr('y', this.margin.bottom - 10)
      .style('text-anchor', 'end')
      .text(
        this.xCat.toUpperCase() +
          ' (Explained variance: ' +
          this.xVariance +
          ')'
      );

    this.gY = this.svg
      .append('g')
      .classed('y axis', true)
      .call(this.yAxis);

    this.gY
      .append('text')
      .classed('label', true)
      .attr('transform', 'rotate(-90)')
      .attr('y', -this.margin.left)
      .attr('dy', '.71em')
      .style('text-anchor', 'end')
      .text(
        this.yCat.toUpperCase() +
          ' (Explained variance: ' +
          this.yVariance +
          ')'
      );

    this.objects = this.svg
      .append('svg')
      .classed('objects', true)
      .attr('width', this.width)
      .attr('height', this.height);

    this.objects
      .append('svg:line')
      .classed('axisLine hAxisLine', true)
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', this.width)
      .attr('y2', 0)
      .attr('transform', 'translate(0,' + this.height + ')');

    this.objects
      .append('svg:line')
      .classed('axisLine vAxisLine', true)
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', 0)
      .attr('y2', this.height);

    this.objects
      .selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
      .classed('dot', true)
      .attr('r', 7)
      .attr(
        'transform',
        d =>
          'translate(' + this.x(d[this.xCat]) + ',' + this.y(d[this.yCat]) + ')'
      )
      .style('fill', d => color(d[this.colorCat]))
      .attr('pointer-events', 'all')
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide);

    d3.select('svg').call(this.brushListener);
    d3.select('rect.overlay').attr('pointer-events', null);

    // Legend
    const legend = this.svg
      .selectAll('.legend')
      .data(color.domain())
      .enter()
      .append('g')
      .classed('legend', true)
      .attr('transform', function(d, i) {
        return 'translate(0,' + i * 20 + ')';
      });

    legend
      .append('circle')
      .attr('r', 5)
      .attr('cx', this.width + 20)
      .attr('fill', color);

    legend
      .append('text')
      .attr('x', this.width + 26)
      .attr('dy', '.35em')
      .style('fill', '#000')
      .attr('class', 'legend-label')
      .text(d => d);
  }

  onResize(event) {
    this.createChart();
  }

  /**
   * Function that is triggered when zooming
   */
  zoomHandler(event) {
    const { transform } = event;
    this.zoomTransform = transform;
    this.svg.selectAll('.dot').attr('transform', t => {
      const x_coord = transform.x + transform.k * this.x(t[this.xCat]);
      const y_coord = transform.y + transform.k * this.y(t[this.yCat]);
      return 'translate(' + x_coord + ',' + y_coord + ')';
    });
    this.gX.call(this.xAxis.scale(transform.rescaleX(this.x)));
    this.gY.call(this.yAxis.scale(transform.rescaleY(this.y)));
  }

  /**
   * Function that is triggered when brushing is performed
   */
  brushHandler(event) {
    const extent = event.selection; // get the selection coordinate
    this.selectedSamples = [];
    this.selectedSamplesStatusTxt = '';
    this.objects.selectAll('.dot').classed('selected', d => {
      let x_coord = this.x(d[this.xCat]);
      let y_coord = this.y(d[this.yCat]);
      if (this.zoomTransform) {
        // recalculate coordinates if zooming has been performed
        x_coord = this.zoomTransform.x + this.zoomTransform.k * x_coord;
        y_coord = this.zoomTransform.y + this.zoomTransform.k * y_coord;
      }

      if (this.isBrushed(extent, x_coord, y_coord)) {
        this.selectedSamples.push({
          ...d,
          x_coord: d[this.xCat],
          y_coord: d[this.yCat]
        });
        return true;
      }

      return false;
    });
  }

  /**
   * Function that returns TRUE or FALSE according if a point is in the selected area
   */
  isBrushed(brush_coords, cx, cy) {
    if (brush_coords) {
      const x0 = brush_coords[0][0] - this.margin.left,
        x1 = brush_coords[1][0] - this.margin.left,
        y0 = brush_coords[0][1] - this.margin.top,
        y1 = brush_coords[1][1] - this.margin.top;
      return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
    }
    return false;
  }

  /**
   * Function that is triggered when principal component for X axis is changed
   */
  onXAxisChange(index) {
    this.updateXCatAndVarianceByIndex(index);
    this.createChart();
  }

  /**
   * Function that is triggered when principal component for Y axis is changed
   */

  onYAxisChange(index) {
    this.updateYCatAndVarianceByIndex(index);
    this.createChart();
  }

  /**
   * Function to update xCat and xVariance for X axis
   */
  updateXCatAndVarianceByIndex(index) {
    this.xCatIndex = index;
    this.xCat = this.pcaData.axisInfo[index].name;
    this.xVariance = this.pcaData.axisInfo[index].var.toFixed(this.precision);
  }

  /**
   * Function to update yCat and yVariance for Y axis
   */
  updateYCatAndVarianceByIndex(index) {
    this.yCatIndex = index;
    this.yCat = this.pcaData.axisInfo[index].name;
    this.yVariance = this.pcaData.axisInfo[index].var.toFixed(this.precision);
  }

  onCreateCustomSampleSet(e) {
    const workspaceId = this.route.snapshot.paramMap.get('workspaceId');

    const samples = this.selectedSamples.map(elem => {
      const sample = { id: elem.sample };
      return sample;
    });

    const dialogRef = this.dialog.open(AddSampleSetComponent);

    dialogRef.afterClosed().subscribe(name => {
      if (name) {
        let observationSet = {
          name: name,
          type: 'Observation set',
          elements: samples,
          multiple: true
        };

        const customObservationSets =
          this.storage.get(workspaceId + '_custom_sets') || [];
        customObservationSets.push(observationSet);
        this.storage.set(workspaceId + '_custom_sets', customObservationSets);
        this.selectedSamplesStatusTxt =
          'The new sample set has been successfully created.';
      }
    });
  }
}
