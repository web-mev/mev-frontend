import {
  Component,
  ChangeDetectionStrategy,
  Input,
  ViewChild,
  ElementRef,
  OnChanges,
  OnInit,
  AfterViewInit
} from '@angular/core';
import { MetadataService } from '@app/core/metadata/metadata.service';
import { Utils } from '@app/shared/utils/utils';
import * as d3 from 'd3';
import d3Tip from 'd3-tip';

/**
 * Box Plotting Component
 *
 * Expects inputs giving the expressions and a feature set
 * This component does the actual plotting.
 */
@Component({
  selector: 'd3-boxplot',
  templateUrl: './box-plotting.component.html',
  styleUrls: ['./box-plotting.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class D3BoxPlotComponent implements OnInit, OnChanges, AfterViewInit {
  /*
  An array of items where each item looks like:
  { '__id__': 'A1BG', 'values': {'sA':1, 'sB':2,...}}
  that is, values is an object where the keys are samples/observations
  and they point at the expression for that sample
  */
  @Input() resourceData;
  @Input() isWait;
  
  @ViewChild('boxPlot')
  svgElement: ElementRef;

  customObservationSets = [];
  customObservationSetsToPlot = [];
  boxPlotData = [];
  boxPlotTypes = {};
  plotReady = false;
  // we end up truncating the data if there are too many genes/features. 
  // This allows us to persist the warning message about this truncation
  fullDataSize; 
  warnMsgArr = [];

  xScale; // scale functions to transform data values into the the range
  yScale;

  /* Chart settings */
  containerId = '#boxPlot';
  showPoints = false; //to toggle whether the user wants to see invididual points
  imageName = 'box_plot'; // file name for downloaded SVG image
  maxFeatureNumber = 80;
  precision = 2;
  margin = { top: 50, right: 150, bottom: 100, left: 60 }; // chart margins
  outerHeight = 500;
  xCat = 'key'; // field name in data for X axis
  yCat = 'Value';
  statsKey = 'stats'
  pointsKey = 'points'
  delta = 0.1; // used for X and Y axis ranges (we add delta to avoid bug when both max and min are zeros)
  gap = 0.1 // fraction of the box width to act as a gap between sibling boxes
  // each gene/feature is given an amount of horizontal space in which to plot. That space is
  // dependent on the width of the screen and the number of genes/features. Assuming we have
  // sufficient space, we fill each 'bin' to this fraction. This fraction (along with the total
  // width and number of genes) sets the dynamic width of the boxes.
  // Once there is not enough room we default to the minimum width and the boxes will overrun each
  // other. (no way around that.)
  fillFraction = 0.8;
  minBoxWidth = 10; // the minimum width of rectangular box
  tooltipOffsetX = 10; // to position the tooltip on the right side of the triggering element

  constructor(
    private metadataService: MetadataService,
  ) {}

  ngOnInit() {
    this.customObservationSets = this.metadataService.getCustomObservationSets();
    this.generateBoxPlot();
  }

  ngOnChanges(): void {
    this.generateBoxPlot();
  }

  ngAfterViewInit() {
  }

  generateBoxPlot() {
    if (this.svgElement){
      this.warnMsgArr = [];
      this.reformatData();
      this.createChart();
      this.plotReady = true;
    }
  }

  togglePoints() {
    this.showPoints = !this.showPoints;
    this.generateBoxPlot();
  }

  /**
   * Function to prepare data for box plot
   */
  reformatData() {

    // it's possible that an observation set chosen by the user has no samples intersecting
    // with the data source. In this case, it's important that we track this and don't show those
    // empty sets.
    // Similarly, we can warn about sets where some of the samples are missing.
    const emptySets = new Set();
    const partialSets = new Set();

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

      // only set this once--
      if (this.fullDataSize === undefined){
        this.fullDataSize = this.resourceData.length;
      }

      if (this.fullDataSize > this.maxFeatureNumber){
        this.warnMsgArr.push(`Note that some of the features have been
          removed since the size of the set exceeded the maximum
          number of features (${this.maxFeatureNumber})
        `)
      }
      this.resourceData = this.resourceData.slice(0, this.maxFeatureNumber);

      const countsFormatted = this.resourceData.map(elem => {
        const newElem = { key: elem.__id__ };
        Object.keys(this.boxPlotTypes).forEach(key => {
          // track the number of samples in this observation set. This will allow
          // us to inform users if their data source does not have all those samples.
          let numSamples = this.boxPlotTypes[key].samples.length;
          const valDict = this.boxPlotTypes[key].samples.reduce(
            (acc, cur) => {
              // acc is the accumulated array
              // cur is the name of the sample.
              // note that if the resourceData does not contain this sample, then
              // it's possible elem.values[cur] can be undefined. This happens in situations
              // where a user makes a plot from data that is a subset of the total data. For
              // instance, if they are plotting normalized expressions from deseq2, then the only
              // samples in that expression matrix will be for those in the contrast. If you then chose
              // to display samples that were not featured in that contrast, the samples will not be found
              let expVal = elem.values[cur];
              if (expVal === undefined){
                // if expVal was undefined, just return the same array
                return acc;
              }
              return [...acc, {pt_label: cur, value: expVal}];
            }, []
          );
          const numbers = valDict.map(
            x => x.value
          );
          if (numbers.length > 0){        
            let stats = Utils.getBoxPlotStatistics(numbers);
            let d = {};
            d[this.statsKey] = stats;
            d[this.pointsKey] = valDict;
            newElem[this.boxPlotTypes[key].yCat] = d;
          } else {
            emptySets.add(key);
          }
          if ((numbers.length > 0) && (numSamples > numbers.length)) {
            partialSets.add(key);
          }
        });
        return newElem;
      });
      this.boxPlotData = countsFormatted;
    } else {
      this.boxPlotData = [];
    }
    // Now, cull any empty sets from boxPlotTypes so we don't attempt to plot them later
    emptySets.forEach((x: string) =>{
      delete this.boxPlotTypes[x];
      this.warnMsgArr.push(`Note that the samples of observation set "${x}" 
      are not included in the expression data source you are plotting from.`);
    });
    partialSets.forEach((x:string) => 
      this.warnMsgArr.push(`Note that some of the samples of observation set "${x}" 
      were not found in the expression data source you are plotting from.`)
    );
  }

  clearChart() {
    d3.select(this.containerId)
    .selectAll('svg')
    .remove();
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
    this.clearChart();

    if (data.length === 0){
      return
    }

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

    // tool tip for individual points (if displayed)
    const pointTip = d3Tip()
      .attr('class', 'd3-tip')
      .offset([-10, 0])
      .html((event, d) => { 
        return d.pt_label + ': ' + d.value.toFixed(this.precision);
       });
    svg.call(pointTip);

    const boxToolTip = d3Tip()
      .attr('class', 'd3-tip')
      .offset([-10, 0])
      .html((event, d) => {

        // Show table with basic statistic values
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
                d[this.boxPlotTypes[key].yCat][this.statsKey].q1.toFixed(this.precision) +
                '</td>'
            )
            .join('') +
          '</tr>' +
          '<tr><td>Median</td>' +
          Object.keys(this.boxPlotTypes)
            .map(
              key =>
                '<td>' +
                d[this.boxPlotTypes[key].yCat][this.statsKey].median.toFixed(this.precision) +
                '</td>'
            )
            .join('') +
          '</tr>' +
          '<tr><td>Q3</td>' +
          Object.keys(this.boxPlotTypes)
            .map(
              key =>
                '<td>' +
                d[this.boxPlotTypes[key].yCat][this.statsKey].q3.toFixed(this.precision) +
                '</td>'
            )
            .join('') +
          '</tr>' +
          '<tr><td>IQR</td>' +
          Object.keys(this.boxPlotTypes)
            .map(
              key =>
                '<td>' +
                d[this.boxPlotTypes[key].yCat][this.statsKey].iqr.toFixed(this.precision) +
                '</td>'
            )
            .join('') +
          '</tr>' +
          '<tr><td>MIN</td>' +
          Object.keys(this.boxPlotTypes)
            .map(
              key =>
                '<td>' +
                d[this.boxPlotTypes[key].yCat][this.statsKey].min.toFixed(this.precision) +
                '</td>'
            )
            .join('') +
          '</tr>' +
          '<tr><td>MAX</td>' +
          Object.keys(this.boxPlotTypes)
            .map(
              key =>
                '<td>' +
                d[this.boxPlotTypes[key].yCat][this.statsKey].max.toFixed(this.precision) +
                '</td>'
            )
            .join('') +
          '</tr>' +
          '</table>';
        return '<b>' + d[this.xCat] + '</b><br>' + htmlTable;
      });
    svg.call(boxToolTip);

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
      d3.max(data, d => <number>d[this.boxPlotTypes[key].yCat][this.statsKey].max || 0)
    );
    const minArr = Object.keys(this.boxPlotTypes).map(key =>
      d3.min(data, d => <number>d[this.boxPlotTypes[key].yCat][this.statsKey].min || 0)
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
    const num_categories = Object.keys(this.boxPlotTypes).length;
    // how much space is 'allotted' for each gene/feature
    const xStep = this.xScale.step();
    const numFeatures = data.length;
    let boxWidth = (this.fillFraction*xStep)/num_categories;
    if(boxWidth < this.minBoxWidth){
      boxWidth = this.minBoxWidth;
      this.warnMsgArr.push(`Note that the screen width and number of features
        are such that the plot may not render correctly. Either decrease the
        size of the gene/feature set or increase the browser window size if
        not already maximized.
      `)
    }
    let gap = this.gap*boxWidth;
    const total_width = num_categories*boxWidth + (num_categories - 1)*gap;
    Object.keys(this.boxPlotTypes).forEach((key, i) => {
      // key is the group name
      const yCatProp = this.boxPlotTypes[key].yCat; //  the group name. Here same as key
      const color = this.boxPlotTypes[key].color;

      // where we "start" the plot relative to the x-position
      // for each plot element (gene)
      const x0 = 0.5*total_width;

      // Main vertical line
      svg
        .selectAll('.vertLines')
        .data(data)
        .enter()
        .append('line')
        .attr(
          'x1',
          (d: any) =>
            //this.xScale(d[this.xCat]) + (1.2 * i - 0.6) * this.boxWidth
            this.xScale(d[this.xCat]) - x0 + 0.5*boxWidth + i*(boxWidth + gap)
        )
        .attr(
          'x2',
          (d: any) =>
            //this.xScale(d[this.xCat]) + (1.2 * i - 0.6) * this.boxWidth
            this.xScale(d[this.xCat]) - x0 + 0.5*boxWidth + i*(boxWidth + gap)
        )
        .attr('y1', (d: any) => this.yScale(d[yCatProp][this.statsKey].min))
        .attr('y2', (d: any) => this.yScale(d[yCatProp][this.statsKey].max))
        .attr('stroke', 'black')
        .style('width', d => 10);

      svg
        .selectAll('.boxes')
        .data(data)
        .enter()
        .append('rect')
        .attr(
          'x',
          //d => this.xScale(d[this.xCat]) + (1.2 * i - 1.1) * this.boxWidth
          d => this.xScale(d[this.xCat]) - x0 + i*(boxWidth + gap)
        )
        .attr('y', d => this.yScale(d[yCatProp][this.statsKey].q3))
        .attr(
          'height',
          d => this.yScale(d[yCatProp][this.statsKey].q1) - this.yScale(d[yCatProp][this.statsKey].q3)
        )
        .attr('width', d => boxWidth)
        .attr('stroke', 'black')
        .style('fill', color)
        .attr('pointer-events', 'all')
        .on('mouseover', function(mouseEvent: any, d) {
          boxToolTip.show(mouseEvent, d, this);
          boxToolTip.style('left', mouseEvent.x + tooltipOffsetX + 'px');
        })
        .on('mouseout', boxToolTip.hide);

      // Medians
      svg
        .selectAll('.medianLines')
        .data(data)
        .enter()
        .append('line')
        .attr('x1', d => {
          if (d[yCatProp][this.statsKey].median !== undefined)
            //return this.xScale(d[this.xCat]) + (1.2 * i - 1.1) * this.boxWidth;
            return this.xScale(d[this.xCat]) - x0 + i*(boxWidth + gap)

          return 0;
        })
        .attr('x2', d => {
          if (d[yCatProp][this.statsKey].median !== undefined)
            //return this.xScale(d[this.xCat]) + (1.2 * i - 0.1) * this.boxWidth;
            return this.xScale(d[this.xCat]) - x0 + i*(boxWidth + gap) + boxWidth;

          return 0;
        })
        .attr('y1', d => this.yScale(d[yCatProp][this.statsKey].median))
        .attr('y2', d => this.yScale(d[yCatProp][this.statsKey].median))
        .attr('stroke', 'black')
        .style('width', d => 80);

       // Add individual points with jitter
       // Since the outer loop is iterating over the groups/observationSets,
       // the index i is related to the current group
      if (this.showPoints) {
        svg
          .selectAll('genePoints')
          .data(data) //recall, an array where each item concerns a single gene
          .enter()//going gene-by-gene
          // hence in an accessor function d looks like
          /*
              {
                "key": "TXNIP",
                "RHS": {
                    'stats':{
                      "q1": 95707,
                      "median": 141675,
                      "q3": 172371,
                      "iqr": 76664,
                      "min": 79023,
                      "max": 197500
                    },
                    'points': [
                      {pt_label: 'sampleA', 'value': 44}
                      ...
                    ]
                },
                "LHS": {
                  "q1": 155988,
                  "median": 159530,
                  "q3": 169860,
                  "iqr": 13872,
                  "min": 92409,
                  "max": 236318
                }
              }
          */
          .each((d, idx, nodes) => {
            // d now concerns a single gene
            let groupDataForFeature = d[yCatProp][this.pointsKey];
            let featureName = d[this.xCat];
            d3.select(nodes[idx])
              .selectAll('.indPoints')
              .data(groupDataForFeature)
              .enter()
              .append('circle')
              .attr(
                'cx', d=>
                this.xScale(data[idx][this.xCat]) -
                  x0 + i*(boxWidth + gap) 
                  + Math.random() * boxWidth
              )
              .attr('cy', d => this.yScale(d['value']))
              .attr('r', 3)
              .style('fill', color)
              .attr('stroke', '#000000')
              .attr('pointer-events', 'all')
              .on('mouseover', function(mouseEvent: any, d) {
                pointTip.show(mouseEvent, d, this);
                pointTip.style('left', mouseEvent.x + tooltipOffsetX + 'px');
              })
              .on('mouseout', pointTip.hide);
          });
        }
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
    this.generateBoxPlot();
  }
}
