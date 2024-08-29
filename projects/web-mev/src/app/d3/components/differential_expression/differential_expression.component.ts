import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ViewChild,
  AfterViewInit,
  Input,
  ElementRef
} from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { AnalysesService } from '@app/features/analysis/services/analysis.service';
import { merge, BehaviorSubject, Observable } from 'rxjs';
import { tap, finalize } from 'rxjs/operators';
import { DataSource } from '@angular/cdk/table';
import * as d3 from 'd3';
import d3Tip from 'd3-tip';
import { FormGroup, FormControl } from '@angular/forms';
import { CustomSetType, CustomSet } from '@app/_models/metadata';
import { MatDialog } from '@angular/material/dialog';
import { AddSampleSetComponent } from '../dialogs/add-sample-set/add-sample-set.component';
import { MetadataService } from '@app/core/metadata/metadata.service';
import { Utils } from '@app/shared/utils/utils';
import { NotificationService } from '../../../core/core.module';
import { environment } from '@environments/environment';
import { catchError } from "rxjs/operators";
import { HttpClient } from '@angular/common/http';

/**
 * Differential expression component
 *
 * Used for common behavior of the various differential expression methods
 */
@Component({
  selector: 'mev-diff-exp',
  templateUrl: './differential_expression.component.html',
  styleUrls: ['./differential_expression.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class DifferentialExpressionComponent implements AfterViewInit {
  @Input() outputs;
  dataSource: FeaturesDataSource; // datasource for MatTable
  boxPlotData; // data retrieved from the dgeResourceId resource, pre-processed for D3 box plot visualization
  dgeResourceId;
  analysisName = '';
  imageName = '';

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('boxPlot') svgElement: ElementRef;

  private readonly API_URL = environment.apiUrl;

  /* Table settings */
  displayedColumns = [
    'name',
    'overall_mean',
    'log2FoldChange',
    'pvalue',
    'padj',
    'lfcSE',
    'stat'
  ];
  operators = [
    { id: 'eq', name: ' = ' },
    { id: 'gte', name: ' >=' },
    { id: 'gt', name: ' > ' },
    { id: 'lte', name: ' <=' },
    { id: 'lt', name: ' < ' },
    { id: 'absgt', name: 'ABS(x) > ' },
    { id: 'abslt', name: 'ABS(x) < ' }
  ];

  defaultPageIndex = 0;
  defaultPageSize = 10;
  defaultSorting = { field: 'padj', direction: 'asc' };

  // Controls how large a custom FeatureSet can be.
  // Otherwise, clicking the 'add features set' button
  // with a full table could create exceptionally large feature sets
  // (which aren't typically useful anyway)
  maxFeatureSetSize = 500;

  /* Table filters */
  allowedFilters = {
    /*name: { defaultValue: '', hasOperator: false },*/
    padj: {
      defaultValue: '0.05',
      hasOperator: true,
      operatorDefaultValue: 'lt'
    },
    log2FoldChange: {
      defaultValue: '2',
      hasOperator: true,
      operatorDefaultValue: 'absgt'
    }
  };

  filterForm = new FormGroup({});

  /* D3 Chart settings */
  containerId = '#boxPlot';
  margin = { top: 50, right: 300, bottom: 100, left: 50 };
  outerHeight = 700;
  precision = 2;
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
  //boxWidth = 20; // the width of rectangular box
  jitterWidth = 10;
  tooltipOffsetX = 10; // to position the tooltip on the right side of the triggering element

  boxPlotTypes = {
    Experimental: {
      label: 'Treated/Experimental',
      yCat: 'experValues',
      yPoints: 'experPoints',
      color: '#f40357'
    },
    Base: {
      label: 'Baseline/Control',
      yCat: 'baseValues',
      yPoints: 'basePoints',
      color: '#f4cc03'
    }
  };
  xCat = 'key'; // field name in data for X axis
  yExperCat = this.boxPlotTypes.Experimental.yCat; // field name in data for Y axis (used to build experimental box plots)
  yBaseCat = this.boxPlotTypes.Base.yCat; // field name in data for Y axis (used to build baseline box plots)
  yExperPoints = this.boxPlotTypes.Experimental.yPoints; // field name in data for Y axis (used to draw individual points for experimental samples)
  yBasePoints = this.boxPlotTypes.Base.yPoints; // field name in data for Y axis (used to draw individual points for baseline samples)
  xScale; // scale functions to transform data values into the the range
  yScale;
  customObservationSets: CustomSet[];

  constructor(
    private analysesService: AnalysesService,
    public dialog: MatDialog,
    private metadataService: MetadataService,
    private readonly notificationService: NotificationService,
    private httpClient: HttpClient,
  ) {
    this.dataSource = new FeaturesDataSource(this.analysesService);

    // adding form controls depending on the tables settings (the allowedFilters property)
    for (const key in this.allowedFilters) {
      if (this.allowedFilters.hasOwnProperty(key)) {
        // TSLint rule
        const defaultValue = this.allowedFilters[key].defaultValue;
        this.filterForm.addControl(key, new FormControl(defaultValue));
        if (this.allowedFilters[key].hasOperator) {
          const operatorDefaultValue = this.allowedFilters[key]
            .operatorDefaultValue;
          this.filterForm.addControl(
            key + '_operator',
            new FormControl(operatorDefaultValue)
          );
        }
      }
    }
  }

  ngAfterViewInit() {
    this.boxPlotTypes.Base.label = this.outputs.group1;
    this.boxPlotTypes.Experimental.label = this.outputs.group2;

    this.sort.sortChange.subscribe(
      () => (this.paginator.pageIndex = this.defaultPageIndex)
    );
    this.dataSource.connect().subscribe(featureData => {
      this.boxPlotData = featureData;
      this.preprocessBoxPlotData();
      // this.createChart();
    });
    merge(this.sort.sortChange, this.paginator.page)
      .pipe(
        tap(() => {
          this.loadFeaturesPage();
          this.preprocessBoxPlotData();
          // this.createChart();
        })
      )
      .subscribe();
  }

  ngOnChanges(): void {
    this.initializeFeatureResource();
    this.customObservationSets = this.metadataService.getCustomObservationSets();
  }

  initializeFeatureResource(): void {
    this.dgeResourceId = this.outputs.dge_results;
    const sorting = {
      sortField: this.defaultSorting.field,
      sortDirection: this.defaultSorting.direction
    };
    // this.dataSource.loadFeatures(
    //   this.dgeResourceId,
    //   {},
    //   sorting,
    //   this.defaultPageIndex,
    //   this.defaultPageSize
    // );
    this.dataSource.loadFeatures(
      this.dgeResourceId,
      { 'padj': '[lt]:0.05', 'log2FoldChange': '[absgt]:2.0' },
      sorting,
      this.defaultPageIndex,
      this.defaultPageSize
    );
  }

  /**
   * Function is triggered when submitting the form with table filters
   */
  onSubmit() {
    this.paginator.pageIndex = this.defaultPageIndex;
    this.loadFeaturesPage();
  }

  /**
   * Function is triggered when resizing the chart
   */
  onResize(event) {
    this.createChart();
  }


  /**
   * Function to prepape the outputs data for D3 box plot visualization
   */
  preprocessBoxPlotData() {
    let annotation_uuid = this.outputs.annotations
    let group1Name = this.outputs.group1
    let group2Name = this.outputs.group2
    let ann_col = this.outputs.ann_col
    this.httpClient.get(`${this.API_URL}/resources/${annotation_uuid}/contents/`).pipe(
      catchError(error => {
        this.notificationService.error(`Error ${error.status}: ${error.error.error}`);
        throw error;
      })
    ).subscribe(res => {
      let group1Arr = []
      let group2Arr = []
      for (let i in res) {
        let obj = res[i]
        if (obj['values'][ann_col] === group1Name) {
          group1Arr.push(obj['__id__'])
        } else if (obj['values'][ann_col] === group2Name) {
          group2Arr.push(obj['__id__'])
        }
      }

      this.handleResponseBoxPlotData(group1Arr, group2Arr)
    })


  }

  handleResponseBoxPlotData(baseSamples, experSamples) {
    /* The input to the basic dge analysis is two observation sets. To populate that option,
      *  the user would have had to define those. To keep everything consistent, we query
      *  the existing observation sets and compare them to the baseSamples/experSamples. If they
      *  match, then we color the groups based on the colors assigned to those observation sets.
      */
    this.customObservationSets.forEach(
      obsSet => {
        const obsSetSamples = obsSet.elements.map(elem => elem.id);
        if (Utils.stringArraysEquivalent(obsSetSamples, baseSamples)) {
          // matches the baseSamples array
          if (obsSet.color) {
            this.boxPlotTypes.Base.color = obsSet.color
          }
        }
        if (Utils.stringArraysEquivalent(obsSetSamples, experSamples)) {
          // matches the experSamples array
          if (obsSet.color) {
            this.boxPlotTypes.Experimental.color = obsSet.color
          }
        }
      }
    );

    const countsFormatted = this.boxPlotData.map(elem => {
      const baseNumbers = baseSamples.reduce(
        (acc, cur) => [...acc, elem[cur]],
        []
      );
      const experNumbers = experSamples.reduce(
        (acc, cur) => [...acc, elem[cur]],
        []
      );
      const newElem = { key: elem.name };
      newElem[this.yExperCat] = Utils.getBoxPlotStatistics(experNumbers);
      newElem[this.yBaseCat] = Utils.getBoxPlotStatistics(baseNumbers);
      const experPts = [];
      experSamples.forEach((k, i) => experPts.push({ pt_label: k, value: experNumbers[i] }));
      const basePts = [];
      baseSamples.forEach((k, i) => basePts.push({ pt_label: k, value: baseNumbers[i] }));
      newElem[this.yExperPoints] = experPts;
      newElem[this.yBasePoints] = basePts;
      return newElem;
    });
    this.boxPlotData = countsFormatted;

    // overwrite labels if there are custom names defined by the user
    if (this.outputs.base_condition_name) {
      this.boxPlotTypes.Base.label = this.outputs.base_condition_name;
    }

    if (this.outputs.experimental_condition_name) {
      this.boxPlotTypes.Experimental.label = this.outputs.experimental_condition_name;
    }

    this.createChart();
  }

  /**
   * Function that is triggered when the user clicks the "Create a custom sample" button
   */
  onCreateCustomFeatureSet() {

    // We don't want to create exceptionally large feature sets. Check
    // that they don't exceed some preset size
    const setSize = this.dataSource.featuresCount;
    if (setSize > this.maxFeatureSetSize) {
      const errorMessage = `The current size of 
        your set (${setSize}) is larger than the 
        maximum allowable size (${this.maxFeatureSetSize}).
        Please filter the table further to reduce the size.`
      this.notificationService.error(errorMessage);
      return;
    }

    const dialogRef = this.dialog.open(AddSampleSetComponent, {
      data: { type: CustomSetType.FeatureSet }
    });

    dialogRef.afterClosed().subscribe(customSetData => {
      if (customSetData) {
        // We want ALL of the features passing the filter, not just those shown on the immediate
        // page in the table.
        const filterValues = this.createFilters();
        this.analysesService
          .getResourceContent(
            this.dgeResourceId,
            null,
            null,
            filterValues,
            {}
          )
          .subscribe(features => {
            const elements = features.map(feature => {
              return { id: feature.__id__ };
            });
            const customSet = {
              name: customSetData.name,
              color: customSetData.color,
              type: CustomSetType.FeatureSet,
              elements: elements,
              multiple: true
            };
            this.metadataService.addCustomSet(customSet);
          });
      }
    });
  }

  /**
   * Function to generate D3 box plot
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

        // if the pt_label exists we know we are hovering over an individual point
        if ('pt_label' in d) {
          return d.pt_label + ': ' + d.value.toFixed(this.precision);
        }

        // if it is a hover over a box plot, show table with basic statistic values
        const htmlTable =
          '<table><thead><th></th><th>' +
          this.boxPlotTypes.Experimental.label +
          '</th><th>' +
          this.boxPlotTypes.Base.label +
          '</th><thead>' +
          '<tr><td>Q1</td><td>' +
          d[this.yExperCat].q1.toFixed(this.precision) +
          '</td><td>' +
          d[this.yBaseCat].q1.toFixed(this.precision) +
          '</td></tr>' +
          '<tr><td>Median</td><td>' +
          d[this.yExperCat].median.toFixed(this.precision) +
          '</td><td>' +
          d[this.yBaseCat].median.toFixed(this.precision) +
          '</td></tr>' +
          '<tr><td>Q3</td><td>' +
          d[this.yExperCat].q3.toFixed(this.precision) +
          '</td><td>' +
          d[this.yBaseCat].q3.toFixed(this.precision) +
          '</td></tr>' +
          '<tr><td>IQR</td><td>' +
          d[this.yExperCat].iqr.toFixed(this.precision) +
          '</td><td>' +
          d[this.yBaseCat].iqr.toFixed(this.precision) +
          '</td></tr>' +
          '<tr><td>MIN</td><td>' +
          d[this.yExperCat].min.toFixed(this.precision) +
          '</td><td>' +
          d[this.yBaseCat].min.toFixed(this.precision) +
          '</td></tr>' +
          '<tr><td>MAX</td><td>' +
          d[this.yExperCat].max.toFixed(this.precision) +
          '</td><td>' +
          d[this.yBaseCat].max.toFixed(this.precision) +
          '</td></tr>' +
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

    const experMaxVal = d3.max(data, d => <number>d[this.yExperCat].max);
    const experMinVal = d3.min(data, d => <number>d[this.yExperCat].min);
    const baseMaxVal = d3.max(data, d => <number>d[this.yBaseCat].max);
    const baseMinVal = d3.min(data, d => <number>d[this.yBaseCat].min);
    const yMax = Math.max(baseMaxVal, experMaxVal);
    const yMin = Math.min(baseMinVal, experMinVal);
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
    let boxWidth = (this.fillFraction * xStep) / num_categories;
    if (boxWidth < this.minBoxWidth) {
      boxWidth = this.minBoxWidth;
      // this.warnMsgArr.push(`Note that the screen width and number of features
      //   are such that the plot may not render correctly. Either decrease the
      //   size of the gene/feature set or increase the browser window size if
      //   not already maximized.
      // `)
    }
    let gap = this.gap * boxWidth;
    const total_width = num_categories * boxWidth + (num_categories - 1) * gap;
    Object.keys(this.boxPlotTypes).forEach((key, i) => {
      const yCatProp = this.boxPlotTypes[key].yCat; //e.g. 'experValues'
      const yPointsProp = this.boxPlotTypes[key].yPoints; //e.g. 'experPoints'
      const color = this.boxPlotTypes[key].color;

      // where we "start" the plot relative to the x-position
      // for each plot element (gene)
      const x0 = 0.5 * total_width;

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
            this.xScale(d[this.xCat]) - x0 + 0.5 * boxWidth + i * (boxWidth + gap)

        )
        .attr(
          'x2',
          (d: any) =>
            //this.xScale(d[this.xCat]) + (1.2 * i - 0.6) * this.boxWidth
            this.xScale(d[this.xCat]) - x0 + 0.5 * boxWidth + i * (boxWidth + gap)

        )
        .attr('y1', (d: any) => this.yScale(d[yCatProp].min))
        .attr('y2', (d: any) => this.yScale(d[yCatProp].max))
        .attr('stroke', 'black')
        .style('width', 10);

      svg
        .selectAll('.boxes')
        .data(data)
        .enter()
        .append('rect')
        .attr(
          'x',
          //d => this.xScale(d[this.xCat]) + (1.2 * i - 1.1) * this.boxWidth
          d => this.xScale(d[this.xCat]) - x0 + i * (boxWidth + gap)

        )
        .attr('y', d => this.yScale(d[yCatProp].q3))
        .attr(
          'height',
          d => this.yScale(d[yCatProp].q1) - this.yScale(d[yCatProp].q3)
        )
        .attr('width', d => boxWidth)
        .attr('stroke', 'black')
        .style('fill', color)
        .attr('pointer-events', 'all')
        .on('mouseover', function (mouseEvent: any, d) {
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
        .attr(
          'x1', d => {
            if (d[yCatProp].median !== undefined) {
              return this.xScale(d[this.xCat]) - x0 + i * (boxWidth + gap)
            }
            return 0;
          }

        )
        // .attr(
        //   'x2',
        //   d => this.xScale(d[this.xCat]) + (1.2 * i - 0.1) * this.boxWidth
        // )
        .attr('x2', d => {
          if (d[yCatProp].median !== undefined) {
            //return this.xScale(d[this.xCat]) + (1.2 * i - 0.1) * this.boxWidth;
            return this.xScale(d[this.xCat]) - x0 + i * (boxWidth + gap) + boxWidth;
          }
          return 0;
        })
        .attr('y1', d => this.yScale(d[yCatProp].median))
        .attr('y2', d => this.yScale(d[yCatProp].median))
        .attr('stroke', 'black')
        .style('width', 80);

      // Add individual points with jitter
      svg
        .selectAll('genePoints')
        .data(data)
        .enter()
        .each((d, ix, nodes) => {
          d3.select(nodes[ix])
            .selectAll('.individualPoints')
            .data(d[yPointsProp])
            .enter()
            .append('circle')
            // .attr(
            //   'cx',
            //   this.xScale(data[ix][this.xCat]) +
            //     (1.2 * i - 0.6) * this.boxWidth -
            //     this.jitterWidth / 2 +
            //     Math.random() * this.jitterWidth
            // )
            .attr(
              'cx', d =>
              this.xScale(data[ix][this.xCat]) -
              x0 + i * (boxWidth + gap)
              + Math.random() * boxWidth
            )
            .attr('cy', d => this.yScale(d['value']))
            .attr('r', 3)
            .style('fill', color)
            .attr('stroke', '#000000')
            .attr('pointer-events', 'all')
            .on('mouseover', function (mouseEvent: any, d) {
              tip.show(mouseEvent, d, this);
              tip.style('left', mouseEvent.x + tooltipOffsetX + 'px');
            })
            .on('mouseout', tip.hide);
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
        .attr('transform', function (d, i) {
          return 'translate(0,' + i * 20 + ')';
        });

      legend
        .append('circle')
        .attr('r', 5)
        .attr('cx', width + 20)
        .attr('fill', d => d.color);

      legend
        .append('text')
        .attr('x', width + 30)
        .attr('dy', '.35em')
        .style('fill', '#000')
        .attr('class', 'legend-label')
        .text(d => d.label);
    });
  }

  /**
   * Function to construct the parameter filters that are passed to the backend
   */
  createFilters() {
    const formValues = this.filterForm.value; // i.e. {name: "asdfgh", pvalue: 3, pvalue_operator: "lte", log2FoldChange: 2, log2FoldChange_operator: "lte"}
    const paramFilter = {}; // has values {'log2FoldChange': '[absgt]:2'};
    for (const key in this.allowedFilters) {
      if (
        formValues.hasOwnProperty(key) &&
        formValues[key] !== '' &&
        formValues[key] !== null
      ) {
        if (formValues.hasOwnProperty(key + '_operator')) {
          paramFilter[key] =
            '[' + formValues[key + '_operator'] + ']:' + formValues[key];
        } else {
          paramFilter[key] = '[eq]:' + formValues[key];
        }
      }
    }
    return paramFilter;
  }

  /**
   * Function to load features by filters, pages and sorting settings specified by a user
   */
  loadFeaturesPage() {
    const paramFilter = this.createFilters();

    const sorting = {
      sortField: this.sort.active,
      sortDirection: this.sort.direction
    };

    // this.dataSource.loadFeatures(
    //   this.dgeResourceId,
    //   paramFilter,
    //   sorting,
    //   this.paginator.pageIndex,
    //   this.paginator.pageSize
    // );
    this.dataSource.loadFeatures(
      this.dgeResourceId,
      { 'padj': '[lt]:0.05', 'log2FoldChange': '[absgt]:2.0' },
      sorting,
      this.defaultPageIndex,
      this.defaultPageSize
    );
  }
}

export interface DGEFeature {
  name: string;
  overall_mean: number;
  Control: number;
  Experimental: number;
  log2FoldChange: number;
  lfcSE: number;
  stat: number;
  pvalue: number;
  padj: number;
}

export class FeaturesDataSource implements DataSource<DGEFeature> {
  public featuresSubject = new BehaviorSubject<DGEFeature[]>([]);
  public featuresCount = 0;
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private analysesService: AnalysesService) { }

  loadFeatures(
    resourceId: string,
    filterValues: object,
    sorting: object,
    pageIndex: number,
    pageSize: number
  ) {
    this.loadingSubject.next(true);

    this.analysesService
      .getResourceContent(
        resourceId,
        pageIndex + 1,
        pageSize,
        filterValues,
        sorting
      )
      .pipe(finalize(() => this.loadingSubject.next(false)))
      .subscribe(features => {
        this.featuresCount = features.count;
        const featuresFormatted = features.results.map(feature => {
          const newFeature = { name: feature.__id__, ...feature.values };
          return newFeature;
        });
        return this.featuresSubject.next(featuresFormatted);
      });
  }

  connect(): Observable<DGEFeature[]> {
    return this.featuresSubject.asObservable();
  }

  disconnect(): void {
    this.featuresSubject.complete();
    this.loadingSubject.complete();
  }
}
