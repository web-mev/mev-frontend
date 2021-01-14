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
import { CustomSetType } from '@app/_models/metadata';
import { MatDialog } from '@angular/material/dialog';
import { AddSampleSetComponent } from '../dialogs/add-sample-set/add-sample-set.component';
import { MetadataService } from '@app/core/metadata/metadata.service';

@Component({
  selector: 'mev-deseq2',
  templateUrl: './deseq2.component.html',
  styleUrls: ['./deseq2.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class Deseq2Component implements OnInit, AfterViewInit {
  @Input() outputs;
  dataSource: FeaturesDataSource; // datasource for MatTable
  boxPlotData; // data retrieved from the dgeResourceId resource, pre-processed for D3 box plot visualization
  dgeResourceId;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('boxPlot') svgElement: ElementRef;

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
  defaultSorting = { field: 'log2FoldChange', direction: 'asc' };

  /* Table filters */
  allowedFilters = {
    /*name: { defaultValue: '', hasOperator: false },*/
    padj: {
      defaultValue: '',
      hasOperator: true,
      operatorDefaultValue: 'lte'
    },
    log2FoldChange: {
      defaultValue: '',
      hasOperator: true,
      operatorDefaultValue: 'lte'
    }
  };

  filterForm = new FormGroup({});

  /* D3 Chart settings */
  containerId = '#boxPlot';
  imageName = 'DESeq2'; // file name for downloaded SVG image
  margin = { top: 50, right: 300, bottom: 100, left: 50 };
  outerHeight = 700;
  precision = 2;
  delta = 0.1; // used for X and Y axis ranges (we add delta to avoid bug when both max and min are zeros)
  boxWidth = 20; // the width of rectangular box
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

  constructor(
    private analysesService: AnalysesService,
    public dialog: MatDialog,
    private metadataService: MetadataService
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

  ngOnInit() {
    this.initializeFeatureResource();
  }

  ngAfterViewInit() {
    this.sort.sortChange.subscribe(
      () => (this.paginator.pageIndex = this.defaultPageIndex)
    );
    this.dataSource.connect().subscribe(featureData => {
      this.boxPlotData = featureData;
      this.preprocessBoxPlotData();
      this.createChart();
    });
    merge(this.sort.sortChange, this.paginator.page)
      .pipe(
        tap(() => {
          this.loadFeaturesPage();
          this.preprocessBoxPlotData();
          this.createChart();
        })
      )
      .subscribe();
  }

  ngOnChanges(): void {
    this.initializeFeatureResource();
  }

  initializeFeatureResource(): void {
    this.dgeResourceId = this.outputs.dge_results;
    const sorting = {
      sortField: this.defaultSorting.field,
      sortDirection: this.defaultSorting.direction
    };
    this.dataSource.loadFeatures(
      this.dgeResourceId,
      {},
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
   * Help function to calculate basic statistics for Box Plot
   */
  getBoxPlotStatistics(numbers: number[]) {
    const q1 = d3.quantile(numbers, 0.25);
    const q3 = d3.quantile(numbers, 0.75);
    return {
      q1: q1,
      median: d3.quantile(numbers, 0.5),
      q3: q3,
      iqr: q3 - q1,
      min: d3.min(numbers), // q1 - 1.5 * interQuantileRange
      max: d3.max(numbers) // q3 + 1.5 * interQuantileRange
    };
  }

  /**
   * Function to prepape the outputs data for D3 box plot visualization
   */
  preprocessBoxPlotData() {
    const baseSamples = this.outputs.base_condition_samples.elements.map(
      elem => elem.id
    );
    const experSamples = this.outputs.experimental_condition_samples.elements.map(
      elem => elem.id
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
      newElem[this.yExperCat] = this.getBoxPlotStatistics(experNumbers);
      newElem[this.yBaseCat] = this.getBoxPlotStatistics(baseNumbers);
      newElem[this.yExperPoints] = experNumbers;
      newElem[this.yBasePoints] = baseNumbers;
      return newElem;
    });
    this.boxPlotData = countsFormatted;
  }

  /**
   * Function that is triggered when the user clicks the "Create a custom sample" button
   */
  onCreateCustomFeatureSet() {
    const features = this.dataSource.featuresSubject.value.map(elem => ({
      id: elem.name
    }));
    const dialogRef = this.dialog.open(AddSampleSetComponent, {
      data: { type: CustomSetType.FeatureSet }
    });

    dialogRef.afterClosed().subscribe(customSetData => {
      if (customSetData) {
        const customSet = {
          name: customSetData.name,
          type: CustomSetType.FeatureSet,
          elements: features,
          multiple: true
        };

        this.metadataService.addCustomSet(customSet);
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
        // if it is a hover over an individual point, show the value
        if (d !== Object(d)) return 'Value: ' + d.toFixed(this.precision);

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
          '<tr><td>Q2</td><td>' +
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
    Object.keys(this.boxPlotTypes).forEach((key, i) => {
      const yCatProp = this.boxPlotTypes[key].yCat;
      const yPointsProp = this.boxPlotTypes[key].yPoints;
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
        .style('width', 10);

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
        .attr('width', this.boxWidth)
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
        .attr(
          'x1',
          d => this.xScale(d[this.xCat]) + (1.2 * i - 1.1) * this.boxWidth
        )
        .attr(
          'x2',
          d => this.xScale(d[this.xCat]) + (1.2 * i - 0.1) * this.boxWidth
        )
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
            .attr(
              'cx',
              this.xScale(data[ix][this.xCat]) +
                (1.2 * i - 0.6) * this.boxWidth -
                this.jitterWidth / 2 +
                Math.random() * this.jitterWidth
            )
            .attr('cy', d => this.yScale(d))
            .attr('r', 3)
            .style('fill', color)
            .attr('stroke', '#000000')
            .attr('pointer-events', 'all')
            .on('mouseover', function(mouseEvent: any, d) {
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
        .attr('transform', function(d, i) {
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
   * Function to load features by filters, pages and sorting settings specified by a user
   */
  loadFeaturesPage() {
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

    const sorting = {
      sortField: this.sort.active,
      sortDirection: this.sort.direction
    };

    this.dataSource.loadFeatures(
      this.dgeResourceId,
      paramFilter,
      sorting,
      this.paginator.pageIndex,
      this.paginator.pageSize
    );
  }
}

export interface DESeqFeature {
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

export class FeaturesDataSource implements DataSource<DESeqFeature> {
  public featuresSubject = new BehaviorSubject<DESeqFeature[]>([]);
  public featuresCount = 0;
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private analysesService: AnalysesService) {}

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
          const newFeature = { name: feature.rowname, ...feature.values };
          return newFeature;
        });
        return this.featuresSubject.next(featuresFormatted);
      });
  }

  connect(): Observable<DESeqFeature[]> {
    return this.featuresSubject.asObservable();
  }

  disconnect(): void {
    this.featuresSubject.complete();
    this.loadingSubject.complete();
  }
}
