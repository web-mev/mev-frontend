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
import { AnalysesService } from '@app/features/analysis/services/analysis.service';

@Component({
  selector: 'mev-scatter-plot',
  templateUrl: './scatter-plot.component.html',
  styleUrls: ['./scatter-plot.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class ScatterPlotComponent implements OnChanges {
  @Input() outputs;
  pcaData;
  pcaDataFormatted;

  selectedSamples = [];
  selectedSamplesStatusTxt: string;

  /* Chart settings */
  containerId = '#scatterPlot';
  precision = 2;
  chartViewMode = 'selectionMode'; // default chart view mode
  margin = { top: 50, right: 300, bottom: 50, left: 50 }; // chart margins
  outerWidth = 1050;
  outerHeight = 500;

  colorCat = 'sample'; // data field used for conditional color formatting

  /* D3 chart variables */
  xAxis; // axes
  yAxis;
  xCat; // field name in data for X axis (it's 'pc1' for default view)
  yCat; // field name in data for Y axis (it's 'pc2' for default view)
  xCatIndex: number; // order of prinicipal component for X axis (0 for default view)
  yCatIndex: number; // order of prinicipal component for Y axis (1 for default view)
  xVariance; // explained variance for X and Y axes
  yVariance;
  xScale; // scale functions to transform data values into the the range
  yScale;
  gX; // group elements for all the components of the X and Y-axis
  gY;
  zoomListener;
  brushListener;
  zoomTransform;

  constructor(
    private storage: LclStorageService,
    private route: ActivatedRoute,
    public dialog: MatDialog,
    private apiService: AnalysesService
  ) {}

  ngOnChanges(): void {
    this.generatePCAPlot();
  }

  onResize(event) {
    this.createChart();
  }

  /**
   * Function to retrieve data for PCA plot
   */
  generatePCAPlot() {
    const resourceId = this.outputs.pca_coordinates;
    const pca_explained_variances = [];
    let i = 1;
    while (this.outputs.hasOwnProperty('pc' + i + '_explained_variance')) {
      const item = {
        name: 'pc' + i,
        var: this.outputs['pc' + i + '_explained_variance']
      };
      pca_explained_variances.push(item);
      i++;
    }

    this.apiService.getResourceContent(resourceId).subscribe(response => {
      this.pcaData = {
        ...response,
        pca_explained_variances: pca_explained_variances
      };
      this.reformatData();
      this.createChart();
    });
  }

  /**
   * Function to prepare data for PCA plot
   */
  reformatData() {
    const results = this.pcaData.results;
    const pcaPoints = results.map(point => {
      const newPoint = { sample: point.rowname, ...point.values };
      return newPoint;
    });

    this.pcaDataFormatted = {
      pcaPoints: pcaPoints,
      axisInfo: this.pcaData.pca_explained_variances
    };

    // initialise variables for X and Y axes if undefined
    // by default use the 1st principal component for X axis and the 2nd for Y axis
    if (!this.xCat && !this.yCat) {
      this.updateXCatAndVarianceByIndex(0);
      this.updateYCatAndVarianceByIndex(1);
    }
  }

  /**
   * Function is triggered when switching between Zooming and Selection view modes
   */
  onChartViewChange(chartViewMode) {
    this.chartViewMode = chartViewMode;
    const svg = d3.select(this.containerId).select('svg');
    if (chartViewMode === 'selectionMode') {
      // activate brushing
      svg.call(this.brushListener);

      // deactivate zooming
      svg.call(d3.zoom().on('zoom', null));
    }
    if (chartViewMode === 'zoomMode') {
      svg.call(this.zoomListener);

      // reset the brush area to an empty area and deactivate brushing feature
      svg.call(
        d3
          .brush()
          .extent([
            [0, 0],
            [0, 0]
          ])
          .on('start', null)
      );
    }
  }

  /**
   * Function to create scatter plot
   */
  private createChart(): void {
    const delta = 0.1; // used for X and Y axis ranges (we add delta to avoid bug when both max and min are zeros)
    const zoomFactor = 50;
    const width = outerWidth - this.margin.left - this.margin.right;
    const height = outerHeight - this.margin.top - this.margin.bottom;

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const data = this.pcaDataFormatted.pcaPoints;

    d3.select(this.containerId)
      .selectAll('svg')
      .remove();

    /* Setting up X-axis and Y-axis*/
    this.xScale = d3
      .scaleLinear()
      .rangeRound([0, width])
      .nice();

    this.yScale = d3
      .scaleLinear()
      .rangeRound([height, 0])
      .nice();

    const xMax = d3.max(data, d => <number>d[this.xCat]);
    const xMin = d3.min(data, d => <number>d[this.xCat]);
    const yMax = d3.max(data, d => <number>d[this.yCat]);
    const yMin = d3.min(data, d => <number>d[this.yCat]);
    const xRange = xMax - xMin + delta; // add delta to avoid bug when both max and min are zeros
    const yRange = yMax - yMin + delta;
    this.xScale.domain([xMin - xRange * delta, xMax + xRange * delta]);
    this.yScale.domain([yMin - yRange * delta, yMax + yRange * delta]);

    this.xAxis = d3.axisBottom(this.xScale).tickSize(-height);
    this.yAxis = d3.axisLeft(this.yScale).tickSize(-width);

    // Add the Zoom and panning feature
    this.zoomListener = d3
      .zoom()
      .scaleExtent([0, zoomFactor])
      .on('zoom', event => this.zoomHandler(event));

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
      .style('fill', 'none')
      .call(this.zoomListener);

    // Add the brush feature
    this.brushListener = d3
      .brush()
      .extent([
        [this.margin.left, this.margin.top],
        [this.margin.left + width, this.margin.top + height]
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
    svg.call(tip);

    svg
      .append('rect')
      .attr('width', width)
      .attr('height', height)
      .style('fill', 'transparent');

    this.gX = svg
      .append('g')
      .classed('x axis', true)
      .attr('transform', 'translate(0,' + height + ')')
      .call(this.xAxis);

    this.gX
      .append('text')
      .classed('label', true)
      .attr('x', width)
      .attr('y', this.margin.bottom - 10)
      .style('text-anchor', 'end')
      .text(
        this.xCat.toUpperCase() +
          ' (Explained variance: ' +
          this.xVariance +
          ')'
      );

    this.gY = svg
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

    const objects = svg
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
      .attr('r', 7)
      .attr(
        'transform',
        d =>
          'translate(' +
          this.xScale(d[this.xCat]) +
          ',' +
          this.yScale(d[this.yCat]) +
          ')'
      )
      .style('fill', d => color(d[this.colorCat]))
      .attr('pointer-events', 'all')
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide);

    d3.select(this.containerId)
      .select('svg')
      .call(this.brushListener);
    d3.select(this.containerId)
      .select('rect.overlay')
      .attr('pointer-events', null);

    // Legend
    const legend = svg
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
      .attr('cx', width + 20)
      .attr('fill', color);

    legend
      .append('text')
      .attr('x', width + 26)
      .attr('dy', '.35em')
      .style('fill', '#000')
      .attr('class', 'legend-label')
      .text(d => d);
  }

  /**
   * Function that is triggered when zooming
   */
  zoomHandler(event) {
    const { transform } = event;
    this.zoomTransform = transform;
    d3.select(this.containerId)
      .selectAll('.dot')
      .attr('transform', t => {
        const x_coord = transform.x + transform.k * this.xScale(t[this.xCat]);
        const y_coord = transform.y + transform.k * this.yScale(t[this.yCat]);
        return 'translate(' + x_coord + ',' + y_coord + ')';
      });
    this.gX.call(this.xAxis.scale(transform.rescaleX(this.xScale)));
    this.gY.call(this.yAxis.scale(transform.rescaleY(this.yScale)));
  }

  /**
   * Function that is triggered when brushing is performed
   */
  brushHandler(event) {
    const extent = event.selection; // get the selection coordinate
    this.selectedSamples = [];
    this.selectedSamplesStatusTxt = '';
    d3.select(this.containerId)
      .selectAll('.dot')
      .classed('selected', d => {
        let x_coord = this.xScale(d[this.xCat]);
        let y_coord = this.yScale(d[this.yCat]);
        if (this.zoomTransform) {
          // recalculate coordinates if zooming has been performed
          x_coord = this.zoomTransform.x + this.zoomTransform.k * x_coord;
          y_coord = this.zoomTransform.y + this.zoomTransform.k * y_coord;
        }

        if (this.isBrushed(extent, x_coord, y_coord)) {
          this.selectedSamples.push({
            ...(d as object),
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
    this.xCat = this.pcaDataFormatted.axisInfo[index].name;
    this.xVariance = this.pcaDataFormatted.axisInfo[index].var.toFixed(
      this.precision
    );
  }

  /**
   * Function to update yCat and yVariance for Y axis
   */
  updateYCatAndVarianceByIndex(index) {
    this.yCatIndex = index;
    this.yCat = this.pcaDataFormatted.axisInfo[index].name;
    this.yVariance = this.pcaDataFormatted.axisInfo[index].var.toFixed(
      this.precision
    );
  }

  /**
   * Function that is triggered when the user clicks the "Create a custom sample" button
   */
  onCreateCustomSampleSet() {
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
