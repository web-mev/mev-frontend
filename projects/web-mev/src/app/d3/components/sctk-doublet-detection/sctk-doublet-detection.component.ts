import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ViewChild,
  AfterViewInit,
  Input,
  ElementRef
} from '@angular/core';
import * as d3 from 'd3';
import { FormGroup, FormControl } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { AnalysesService } from '@app/features/analysis/services/analysis.service';
import { merge, BehaviorSubject, Observable } from 'rxjs';
import { tap, finalize } from 'rxjs/operators';
import { MetadataService } from '@app/core/metadata/metadata.service';
import { NotificationService } from '../../../core/core.module';
import { AddSampleSetComponent } from '@app/d3/components/dialogs/add-sample-set/add-sample-set.component';
import { CustomSet, CustomSetType } from '@app/_models/metadata';
import { DataSource } from '@angular/cdk/table';

@Component({
  selector: 'mev-sctk-doubletfinder',
  templateUrl: './sctk-doublet-detection.component.html',
  styleUrls: ['./sctk-doublet-detection.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class SctkDoubletDetectionComponent implements OnInit, AfterViewInit {
  @Input() outputs;
  dataSource: ExpressionMatrixDataSource; // datasource for MatTable
  resourceId;
  donutPlotData;
  tablePageData;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('donutPlot') svgElement: ElementRef;
  imageName = 'doublet_detection';
  analysisName = 'SCTK Doublet Finder';
  resourceIdName = 'SctkDoubletFinder.doublet_ids';

  selectedSamples = [];
  customObservationSets = [];
  customSampleSetClass;

  /* Chart settings */
  containerId = '#donutPlot';
  chartViewMode = true;
  precision = 2;
  margin = { top: 50, right: 300, bottom: 50, left: 70 }; // chart margins
  outerHeight = 500;

  // Controls how large a custom FeatureSet can be.
  // Otherwise, clicking the 'add features set' button
  // with a full table could create exceptionally large feature sets
  // (which aren't typically useful anyway)
  maxFeatureSetSize = 500;

  /* Table settings */
  staticCols = ['name', 'doublet_class'];
  dynamicColumns; // will be filled further by dataSource
  displayColumns; // will be the concatenation of static + dynamic cols

  string_operators = [
    { id: 'startswith', name: ' Starts with: ' },
    { id: 'case-ins-eq', name: ' = (case-insensitive) ' },
    { id: 'eq', name: ' = (strict) ' }
  ];

  defaultPageIndex = 0;
  defaultPageSize = 10;
  defaultSorting = { field: 'doublet_class', direction: 'desc' };

  /* Table filters */
  allowedFilters = {
    /*name: { defaultValue: '', hasOperator: false },*/
    __rowname__: {
      defaultValue: '',
      hasOperator: true,
      operatorDefaultValue: 'startswith'
    },
    doublet_class: {
      defaultValue: '',
      hasOperator: true,
      operatorDefaultValue: 'startswith'
    }
  };

  filterForm = new FormGroup({});
  constructor(
    private analysesService: AnalysesService,
    public dialog: MatDialog,
    private metadataService: MetadataService,
    private readonly notificationService: NotificationService
  ) {
    this.dataSource = new ExpressionMatrixDataSource(this.analysesService);
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
    this.initData();
  }
  /* For generalizing, see below from differential_expression.component.ts
  ngOnInit() {
    this.initializeFeatureResource();
  }
  */

  ngAfterViewInit() {
    //See commented code below for later adapting donut chart (or other charts)
    //From differential_expression.component.ts

    this.sort.sortChange.subscribe(
      () => (this.paginator.pageIndex = this.defaultPageIndex)
    );
    this.dataSource.connect().subscribe(expData => {
      this.tablePageData = expData;
    });
    merge(this.sort.sortChange, this.paginator.page)
      .pipe(
        tap(() => {
          this.loadPage();
        })
      )
      .subscribe();

    this.analysesService
      .getResourceContent(this.resourceId, 1, 10 ** 4)
      .subscribe(data => {
        this.donutPlotData = data.results.map(dataRow => {
          return {
            name: dataRow.rowname,
            doublet_class: dataRow.values['doublet_class']
          };
        });
        this.createChart();
      });
  }

  ngOnChanges(): void {
    this.initData();
    //this.initializeFeatureResource();
    //this.customObservationSets = this.metadataService.getCustomObservationSets();
  }

  initData(): void {
    console.log(this.outputs);
    //this.resourceId = this.outputs['SctkDoubletFinder.doublet_ids'];
    this.resourceId = this.outputs[this.resourceIdName];

    const sorting = {
      sortField: this.defaultSorting.field,
      sortDirection: this.defaultSorting.direction
    };
    const paramFilter = this.createFilters();

    this.dataSource.loadData(
      this.resourceId,
      paramFilter, // May need to be left to "{}" so can be adapted as necessary in child classes
      sorting,
      //{},
      this.defaultPageIndex,
      this.defaultPageSize
    );
    this.dataSource.sampleNames$.subscribe(data => {
      this.dynamicColumns = data;
      this.displayColumns = [...this.staticCols, ...data];
    });
  }

  /**
   * Function to construct the parameter filters that are passed to the backend
   */
  createFilters() {
    const formValues = this.filterForm.value; // i.e. {name: "asdfgh", doublet_class: "doublet"}
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

  loadPage() {
    const paramFilter = this.createFilters();

    const sorting = {
      sortField: this.sort.active,
      sortDirection: this.sort.direction
    };

    this.dataSource.loadData(
      this.resourceId,
      paramFilter,
      sorting,
      //{},
      this.paginator.pageIndex,
      this.paginator.pageSize
    );
  }

  /**
   * Function is triggered when submitting the form with table filters
   */
  onSubmit() {
    console.log('submit!');
    this.paginator.pageIndex = this.defaultPageIndex;
    this.loadPage();
  }

  /**
   * Function that is triggered when the user clicks the "Create a custom sample" button
   */
  onCreateCustomFeatureSet() {
    // We don't want to create exceptionally large feature sets. Check
    // that they don't exceed some preset size
    const setSize = this.dataSource.qcCount;
    if (setSize > this.maxFeatureSetSize) {
      const errorMessage = `The current size of
        your set (${setSize}) is larger than the
        maximum allowable size (${this.maxFeatureSetSize}).
        Please filter the table further to reduce the size.`;
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
          .getResourceContent(this.resourceId, null, null, filterValues, {})
          .subscribe(features => {
            const elements = features.map(feature => {
              return { id: feature.rowname };
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
   * Function is triggered when resizing the chart
   */
  onResize(event) {
    this.createChart();
  }

  /**
   * Function is triggered when switching between Chart and Table view modes
   */
  onChartViewChange(chartViewEvent) {
    if (chartViewEvent === 'plotMode') {
      this.chartViewMode = true;
    }
    if (chartViewEvent === 'tableMode') {
      this.chartViewMode = false;
    }
  }

  /**
   * Function that is triggered when the user clicks on an arc of the donut plot
   */
  arcSelectionHandler(): void {
    if (!this.customSampleSetClass) {
      this.selectedSamples = [];
    } else {
      this.selectedSamples = this.donutPlotData.filter(
        samples => samples.doublet_class === this.customSampleSetClass
      );
    }
  }

  createChart(): void {
    const outerWidth = this.svgElement.nativeElement.offsetWidth;
    const outerHeight = this.outerHeight;
    const width = outerWidth - this.margin.left - this.margin.right;
    const height = outerHeight - this.margin.top - this.margin.bottom;
    // const width = 960;
    // const height = 500;
    const radius = Math.min(width, height) / 2;
    const _this = this;

    const data = this.donutPlotData.reduce((a, { name, doublet_class }) => {
      a[doublet_class] = a[doublet_class] || 0;
      a[doublet_class] += 1;
      return a;
    }, {});

    d3.select(this.containerId)
      .selectAll('svg')
      .remove();

    let svg;
    svg = d3
      .select(this.containerId)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

    const color = d3.scaleOrdinal().range(['#193A6F', '#F98125']);

    const pie = d3.pie().value(d => d[1]);
    const pre_pie_data: any = Object.entries(data);
    const data_ready = pie(pre_pie_data);

    const donutTip = d3
      .select(this.containerId)
      .append('div')
      .attr('class', 'donut-tip')
      .style('opacity', 0)
      .style('background', '#FFFFFF')
      .style('color', '#313639')
      .style('padding', '0.5rem')
      .style('border', '1px solid #313639')
      .style('border-radius', '8px')
      .style('width', '60px')
      .style('position', 'absolute')
      .style('text-align', 'center')
      .style('font-weight', 'bold');

    const arc = d3
      .arc()
      .innerRadius(100)
      .outerRadius(radius);

    const selectedArc = d3
      .arc()
      .innerRadius(100)
      .outerRadius(radius + 30);

    // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
    svg
      .selectAll('allSlices')
      .data(data_ready)
      .join('path')
      .attr('d', arc)
      .attr('fill', d => color(d.data[0]))
      .attr('stroke', 'black')
      .style('stroke-width', '2px')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(50)
          .attr('opacity', 0.7);
        donutTip
          .transition()
          .duration(50)
          .style('opacity', 1);
        let num =
          Math.round(
            (d.data[1] / (data_ready[0].data[1] + data_ready[1].data[1])) * 100
          ).toString() + '%';
        donutTip
          .html(num)
          .style('left', width / 2 + 'px')
          .style('top', height / 2 + 'px');
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .transition()
          .duration(50)
          .attr('opacity', 1);
        donutTip
          .transition()
          .duration(50)
          .style('opacity', 0);
      })
      .on('click', function(event, d) {
        if (_this.customSampleSetClass) {
          d3.select(this)
            .transition()
            .duration(1000)
            .attr('d', arc);
          _this.customSampleSetClass = null;
        } else {
          d3.select(this)
            .transition()
            .duration(1000)
            .attr('d', selectedArc);
          _this.customSampleSetClass = d.data[0];
        }
        _this.arcSelectionHandler();
      });

    const legendRectSize = 13;
    const legendSpacing = 7;
    const legend = svg
      .selectAll('.legend')
      .data(color.domain())
      .enter()
      .append('g')
      .attr('class', 'circle-legend')
      .attr('transform', function(d, i) {
        const height = legendRectSize + legendSpacing;
        const offset = (height * color.domain().length) / 2;
        const horz = -2 * legendRectSize - 13;
        const vert = i * height - offset;
        return 'translate(' + horz + ',' + vert + ')';
      });

    legend
      .append('circle')
      .style('fill', color)
      .style('stroke', color)
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', '.5rem');

    legend
      .append('text')
      .attr('x', legendRectSize + legendSpacing)
      .attr('y', legendRectSize - legendSpacing)
      .text(function(d) {
        return d;
      });
  }

  /**
   * Function that is triggered when the user clicks the "Create a custom sample" button
   */
  onCreateCustomSampleSet() {
    const samples = this.chartViewMode
      ? this.selectedSamples.map(elem => {
          const sample = { id: elem.name };
          return sample;
        })
      : null;

    const dialogRef = this.dialog.open(AddSampleSetComponent);

    dialogRef.afterClosed().subscribe(customSetData => {
      if (customSetData) {
        const filterValues = this.createFilters();
        this.analysesService
          .getResourceContent(this.resourceId, null, null, filterValues, {})
          .subscribe(features => {
            const elements = features.map(feature => {
              return { id: feature.rowname };
            });
            const observationSet: CustomSet = {
              name: customSetData.name,
              color: customSetData.color,
              type: CustomSetType.ObservationSet,
              elements: this.chartViewMode ? samples : elements,
              multiple: true
            };

            if (this.metadataService.addCustomSet(observationSet)) {
              this.customObservationSets = this.metadataService.getCustomObservationSets();
            }
          });
      }
    });
  }
}

export interface QCDoubletDetection {
  name: string;
  doublet_class: string;
}

export class ExpressionMatrixDataSource
  implements DataSource<QCDoubletDetection> {
  public qcSubject = new BehaviorSubject<QCDoubletDetection[]>([]);
  public qcCount = 0;
  private sampleNamesSubject = new BehaviorSubject<string[]>([]);
  public sampleNames$ = this.sampleNamesSubject.asObservable();
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();
  constructor(private analysesService: AnalysesService) {}

  loadData(
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
      .subscribe(data => {
        this.qcCount = data.count;
        const qcFormatted = data.results.map(dataRow => {
          return {
            name: dataRow.rowname,
            doublet_class: dataRow.values['doublet_class']
          };
        });
        return this.qcSubject.next(qcFormatted);
      });
  }

  connect(): Observable<QCDoubletDetection[]> {
    return this.qcSubject.asObservable();
  }

  disconnect(): void {
    this.qcSubject.complete();
    this.loadingSubject.complete();
  }
}
