import {
  Component,
  ChangeDetectionStrategy,
  Input,
  OnChanges,
  ElementRef,
  ViewChild
} from '@angular/core';
import * as d3 from 'd3';
import d3Tip from 'd3-tip';
import { MatDialog } from '@angular/material/dialog';
import { AddSampleSetComponent } from '../dialogs/add-sample-set/add-sample-set.component';
import { AnalysesService } from '@app/features/analysis/services/analysis.service';
import { MetadataService } from '@app/core/metadata/metadata.service';
import { CustomSetType, CustomSet } from '@app/_models/metadata';

/**
 * Scatter Plot Component
 *
 * Used for plotting the UMAP projection
 */
@Component({
  selector: 'mev-sctk-umap-scatter-plot',
  templateUrl: './umap-scatter-plot.component.html',
  styleUrls: ['./umap-scatter-plot.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class UmapScatterPlotComponent implements OnChanges {
  @Input() outputs;
  @ViewChild('scatterPlot') svgElement: ElementRef;
  umapData;
  umapDataFormatted;

  selectedSamples = [];
  customObservationSets = [];
  sampleColorMap = {}; // mapping individual samples and colors (used for points in scatter plot)
  sampleSetColors = []; // the list of sample sets and their colors (used for legend in scatter plot)

  /* Chart settings */
  containerId = '#scatterPlot';
  imageName = 'UMAP'; // file name for downloaded SVG image
  maxPointNumber = 10 ** 4;
  precision = 2;
  chartViewMode = 'zoomMode'; // default chart view mode
  margin = { top: 50, right: 300, bottom: 50, left: 70 }; // chart margins
  outerHeight = 500;

  pointCat = 'sample'; // data field used to label individual points



  /* D3 chart variables */
  xAxis; // axes
  yAxis;
  xCat; // field name in data for X axis (e.g. "UMAP1")
  yCat; // field name in data for Y axis (e.g. "UMAP2")
  xScale; // scale functions to transform data values into the the range
  yScale;
  gX; // group elements for all the components of the X and Y-axis
  gY;
  zoomListener;
  brushListener;
  zoomTransform;

  constructor(
    public dialog: MatDialog,
    private apiService: AnalysesService,
    private metadataService: MetadataService
  ) {}

  ngOnChanges(): void {
    this.customObservationSets = this.metadataService.getCustomObservationSets();
    this.generateScatterPlot();
  }

  onResize(event) {
    this.createChart();
  }

  /**
   * Function to retrieve data for plot
   */
  generateScatterPlot() {
    this.chartViewMode = 'zoomMode'; // default mode
    const resourceId = this.outputs['SctkUmapDimensionReduce.umap_output'];

    this.apiService
      .getResourceContent(resourceId, 1, this.maxPointNumber)
      .subscribe(response => {
        this.umapData = {
          ...response
        };
        this.reformatData();
        this.createChart();
      });
  }

  /**
   * Function to prepare data for UMAP plot
   */
  reformatData() {
    const results = this.umapData.results;

    const newPoints = [];
    if (results.length > 0 && results[0].values) {
      const sampleNames = Object.keys(results[0].values);
      sampleNames.forEach(sampleName => {
        const newPoint = { sample: sampleName };
        results.forEach(el => {
          const umapComponent = el.rowname;
          const val = el.values[sampleName];
          newPoint[umapComponent] = val;
        });
        newPoints.push(newPoint);
      });
    }

    // get the x and y 'names' from the rownames. This way we are 
    // not tied to hardcoded values like "umap1"
    this.xCat = results[0].rowname;
    this.yCat = results[1].rowname;

    this.umapDataFormatted = {
      points: newPoints
    };
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
      svg.select('g').call(d3.zoom().on('zoom', null));
    }
    if (chartViewMode === 'zoomMode') {
      svg.select('g').call(this.zoomListener);

      // reset the brush area to an empty area and deactivate brushing feature
      const brush = d3
        .brush()
        .filter(
          event =>
            !event['ctrlKey'] && !event['button'] && event['target'].__data__
        )
        .on('start', null);

      svg.call(
        brush.extent([
          [0, 0],
          [0, 0]
        ])
      );
      svg.call(brush.move, null);
    }
  }

  /**
   * Function to create scatter plot
   */
  private createChart(): void {
    const delta = 0.1; // used for X and Y axis ranges (we add delta to avoid bug when both max and min are zeros)
    const zoomFactor = 50;
    const outerWidth = this.svgElement.nativeElement.offsetWidth;
    const outerHeight = this.outerHeight;
    const width = outerWidth - this.margin.left - this.margin.right;
    const height = outerHeight - this.margin.top - this.margin.bottom;

    const data = this.umapDataFormatted.points;

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

    const group = d3
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
      .filter(
        event =>
          !event['ctrlKey'] && !event['button'] && event['target'].__data__
      )
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
          d[this.pointCat] +
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
    group.call(tip);

    group
      .append('rect')
      .attr('width', width)
      .attr('height', height)
      .style('fill', 'transparent');

    this.gX = group
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
      .text(this.xCat.toUpperCase());

    this.gY = group
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
      .text(this.yCat.toUpperCase());

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
      .attr('r', 3)
      .attr(
        'transform',
        d =>
          'translate(' +
          this.xScale(d[this.xCat]) +
          ',' +
          this.yScale(d[this.yCat]) +
          ')'
      )
      .style('fill', d => {
        return this.sampleColorMap[d[this.pointCat]] || 'grey';
      })
      .attr('stroke', d =>
        this.sampleColorMap[d[this.pointCat]] === 'transparent' ? '#000' : ''
      )
      .attr('pointer-events', 'all')
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide);

    d3.select(this.containerId)
      .select('rect.overlay')
      .attr('pointer-events', null);

    // Legend
    const legendColors = [
      ...this.sampleSetColors,
      { name: 'N/A', color: 'grey' },
      { name: 'Sample belonging to 2+ groups', color: 'transparent' }
    ];
    const legend = group
      .selectAll('.legend')
      .data(legendColors)
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
      .attr('fill', d => d.color)
      .attr('stroke', d => (d.color !== 'transparent' ? d.color : '#000'));

    legend
      .append('text')
      .attr('x', width + 35)
      .attr('dy', '.35em')
      .style('fill', '#000')
      .attr('class', 'legend-label')
      .text(d => d.name);
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
            ...(d as object)
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
   * Function that is triggered when the user clicks the "Create a custom sample" button
   */
  onCreateCustomSampleSet() {
    const samples = this.selectedSamples.map(elem => {
      const sample = { id: elem.sample };
      return sample;
    });

    const dialogRef = this.dialog.open(AddSampleSetComponent);

    dialogRef.afterClosed().subscribe(customSetData => {
      if (customSetData) {
        const observationSet: CustomSet = {
          name: customSetData.name,
          type: CustomSetType.ObservationSet,
          color: customSetData.color,
          elements: samples,
          multiple: true
        };

        if (this.metadataService.addCustomSet(observationSet)) {
          this.customObservationSets = this.metadataService.getCustomObservationSets();
        }
      }
    });
  }

  onObservationCheck(e) {
    const sampleSet = e.source.id;
    const foundSet = this.customObservationSets.find(
      el => el.name === sampleSet
    );
    this.sampleColorMap = {};

    if (e.checked) {
      this.sampleSetColors.push(foundSet);
      const sampleSets = this.sampleSetColors;
      sampleSets.forEach(set => {
        const samples = set.elements.map(el => el.id);
        samples.forEach(sample => {
          this.sampleColorMap[sample] = !this.sampleColorMap[sample]
            ? set.color
            : 'transparent';
        });
      });
    } else {
      this.sampleSetColors = this.sampleSetColors.filter(
        set => set.name !== foundSet.name
      );
      this.sampleSetColors.forEach(set => {
        const samples = set.elements.map(el => el.id);
        samples.forEach(sample => {
          this.sampleColorMap[sample] = !this.sampleColorMap[sample]
            ? set.color
            : 'transparent';
        });
      });
    }

    this.generateScatterPlot();
  }

  isCustomObservationSetChecked(setName) {
    return this.sampleSetColors.find(set => set.name === setName);
  }
}
