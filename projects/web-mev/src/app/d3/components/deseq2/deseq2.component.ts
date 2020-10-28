import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  AfterViewInit,
  Input
} from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { ActivatedRoute } from '@angular/router';
import { AnalysesService } from '@app/features/analysis/services/analysis.service';
import { merge, BehaviorSubject, Observable } from 'rxjs';
import { tap, finalize } from 'rxjs/operators';
import { DataSource } from '@angular/cdk/table';
import * as d3 from 'd3';
import { FormGroup, FormControl } from '@angular/forms';

@Component({
  selector: 'mev-deseq2',
  templateUrl: './deseq2.component.html',
  styleUrls: ['./deseq2.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Deseq2Component implements OnInit, AfterViewInit {
  constructor(
    private route: ActivatedRoute,
    private analysesService: AnalysesService
  ) {
    this.dataSource = new FeaturesDataSource(this.analysesService);

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

  @Input() outputs;
  dataSource: FeaturesDataSource;
  dgeResourceId;
  countsResourceId;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  @ViewChild(MatSort) sort: MatSort;

  // @ViewChild('input') input: ElementRef;

  boxPlotData;

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
    pvalue: {
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

  /* Chart settings */
  containerId = '#boxPlot';
  margin = { top: 50, right: 300, bottom: 50, left: 50 };
  outerWidth = 1050;
  outerHeight = 500;

  /* D3 chart variables */
  xCat; // field name in data for X axis
  yCat; // field name in data for Y axis (used to build box plots)
  yPoints; // field name in data for Y axis (used to draw individual points)
  xScale; // scale functions to transform data values into the the range
  yScale;

  ngOnInit() {
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

  ngOnChanges(): void {
    this.generateBoxPlot();
  }

  ngAfterViewInit() {
    this.sort.sortChange.subscribe(
      () => (this.paginator.pageIndex = this.defaultPageIndex)
    );

    // TO DO: add filtering
    // fromEvent(this.input.nativeElement, 'keyup')
    //     .pipe(
    //         debounceTime(150),
    //         distinctUntilChanged(),
    //         tap(() => {
    //             this.paginator.pageIndex = 0;

    //             this.loadFeaturesPage();
    //         })
    //     )
    //     .subscribe();

    merge(this.sort.sortChange, this.paginator.page)
      .pipe(
        tap(() => {
          this.loadFeaturesPage();
          this.generateBoxPlot();
        })
      )
      .subscribe();
  }

  onSubmit() {
    this.loadFeaturesPage();
  }

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
      interQuantileRange: q3 - q1,
      min: d3.min(numbers), //q1 - 1.5 * interQuantileRange
      max: d3.max(numbers) //q3 + 1.5 * interQuantileRange
    };
  }

  generateBoxPlot() {
    const pageIndex = this.paginator?.pageIndex || this.defaultPageIndex;
    const pageSize = this.paginator?.pageSize || this.defaultPageSize;
    this.countsResourceId = this.outputs.normalized_counts;

    const baseSamples = this.outputs.base_condition_samples.elements.map(
      elem => elem.id
    );
    const experSamples = this.outputs.experimental_condition_samples.elements.map(
      elem => elem.id
    );

    this.dataSource
      .loadCounts(this.countsResourceId, 'asc', pageIndex, pageSize)
      .subscribe(counts => {
        const countsFormatted = counts.results.map(elem => {
          const baseNumbers = baseSamples.reduce(
            (acc, cur) => [...acc, elem.values[cur]],
            []
          );
          const experNumbers = experSamples.reduce(
            (acc, cur) => [...acc, elem.values[cur]],
            []
          );
          return {
            key: elem.rowname,
            experValues: this.getBoxPlotStatistics(baseNumbers),
            baseValues: this.getBoxPlotStatistics(experNumbers),
            experPoints: experNumbers,
            basePoints: baseNumbers
          };
        });
        this.boxPlotData = countsFormatted;
        this.createChart();
      });
  }

  loadFeaturesPage() {
    const formValues = this.filterForm.value; // Example: {name: "asdfgh", pvalue: 3, pvalue_operator: "lte", log2FoldChange: 2, log2FoldChange_operator: "lte"}
    const paramFilter = {}; // Example: {'log2FoldChange': '[absgt]:2'};
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
    console.log('this.sort', this.sort);

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

  createChart(): void {
    const delta = 0.1; // used for X and Y axis ranges (we add delta to avoid bug when both max and min are zeros)
    const boxWidth = 20; // the width of rectangular box
    const jitterWidth = 0;

    this.xCat = 'key';
    this.yCat = 'Values';
    this.yPoints = 'Points';
    const boxPlotColors = [
      { group: 'Treated', color: '#69b3a2' },
      { group: 'Control', color: '#a1887f' }
    ];

    const width = outerWidth - this.margin.left - this.margin.right;
    const height = outerHeight - this.margin.top - this.margin.bottom;

    const data = this.boxPlotData;
    const sumstat = this.boxPlotData;

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

    /* Setting up X-axis and Y-axis*/
    this.xScale = d3
      .scaleBand()
      .rangeRound([0, width])
      .domain(sumstat.map(d => d.key))
      .paddingInner(1)
      .paddingOuter(0.5);

    this.yScale = d3.scaleLinear().rangeRound([height, 0]);

    const experMaxVal = d3.max(data, d => <number>d['exper' + this.yCat].max);
    const experMinVal = d3.min(data, d => <number>d['exper' + this.yCat].min);
    const baseMaxVal = d3.max(data, d => <number>d['base' + this.yCat].max);
    const baseMinVal = d3.min(data, d => <number>d['base' + this.yCat].min);
    const yMax = Math.max(baseMaxVal, experMaxVal);
    const yMin = Math.min(baseMinVal, experMinVal);
    const yRange = yMax - yMin + delta; // add delta to avoid bug when both max and min are zeros

    this.yScale.domain([yMin - yRange * delta, yMax + yRange * delta]);

    svg
      .append('g')
      .attr('transform', 'translate(0,' + height + ')')
      .attr('class', 'x-axis')
      .call(d3.axisBottom(this.xScale));

    svg.append('g').call(d3.axisLeft(this.yScale));

    const boxPlotTypes = ['exper', 'base'];
    boxPlotTypes.forEach((boxPlotType, i) => {
      // Main vertical line
      svg
        .selectAll('vertLines' + i)
        .data(sumstat)
        .enter()
        .append('line')
        .attr(
          'x1',
          (d: any) => this.xScale(d[this.xCat]) + (1.2 * i - 0.6) * boxWidth
        )
        .attr(
          'x2',
          (d: any) => this.xScale(d[this.xCat]) + (1.2 * i - 0.6) * boxWidth
        )
        .attr('y1', (d: any) => this.yScale(d[boxPlotType + this.yCat].min))
        .attr('y2', (d: any) => this.yScale(d[boxPlotType + this.yCat].max))
        .attr('stroke', 'black')
        .style('width', 10);

      svg
        .selectAll('boxes' + i)
        .data(sumstat)
        .enter()
        .append('rect')
        .attr('x', d => this.xScale(d[this.xCat]) + (1.2 * i - 1.1) * boxWidth)
        .attr('y', d => this.yScale(d[boxPlotType + this.yCat].q3))
        .attr(
          'height',
          d =>
            this.yScale(d[boxPlotType + this.yCat].q1) -
            this.yScale(d[boxPlotType + this.yCat].q3)
        )
        .attr('width', boxWidth)
        .attr('stroke', 'black')
        .style('fill', boxPlotColors[i].color);

      // Medians
      svg
        .selectAll('medianLines' + i)
        .data(sumstat)
        .enter()
        .append('line')
        .attr('x1', d => this.xScale(d[this.xCat]) + (1.2 * i - 1.1) * boxWidth)
        .attr('x2', d => this.xScale(d[this.xCat]) + (1.2 * i - 0.1) * boxWidth)
        .attr('y1', d => this.yScale(d[boxPlotType + this.yCat].median))
        .attr('y2', d => this.yScale(d[boxPlotType + this.yCat].median))
        .attr('stroke', 'black')
        .style('width', 80);

      // Add individual points with jitter
      svg
        .selectAll('genePoints' + i)
        .data(data)
        .enter()
        .each((d, ix, nodes) => {
          d3.select(nodes[ix])
            .selectAll('individualPoints')
            .data(d[boxPlotType + this.yPoints])
            .enter()
            .append('circle')
            .attr(
              'cx',
              this.xScale(data[ix][this.xCat]) +
                (1.2 * i - 0.6) * boxWidth -
                jitterWidth / 2 +
                Math.random() * jitterWidth
            )
            .attr('cy', d => this.yScale(d))
            .attr('r', 3)
            .style('fill', boxPlotColors[i].color)
            .attr('stroke', '#000000');
        });
    });

    // Legend
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
      .text(d => d.group);
  }
}

export interface Feature {
  id: number;
  description: string;
  duration: string;
  seqNo: number;
}

export class FeaturesDataSource implements DataSource<Feature> {
  private featuresSubject = new BehaviorSubject<Feature[]>([]);
  private countsSubject = new BehaviorSubject<any[]>([]);
  public featuresCount = 0;
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private countLoadingSubject = new BehaviorSubject<boolean>(false);
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

    //const filter = { 'log2FoldChange': '[absgt]:2' };

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

  /**
   * Function to get the normalized counts for the Box Plot
   */
  loadCounts(
    resourceId: string,
    // filter: string,
    sortDirection: string,
    pageIndex: number,
    pageSize: number
  ) {
    this.countLoadingSubject.next(true);

    return this.analysesService
      .getResourceContent(resourceId, pageIndex + 1, pageSize)
      .pipe(finalize(() => this.countLoadingSubject.next(false)));
  }

  connect(): Observable<Feature[]> {
    return this.featuresSubject.asObservable();
  }

  disconnect(): void {
    this.featuresSubject.complete();
    this.loadingSubject.complete();
  }
}
