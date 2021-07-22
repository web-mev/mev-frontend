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
import d3Tip from 'd3-tip';
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
import { CustomSetType } from '@app/_models/metadata';
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

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('donutPlot') svgElement: ElementRef;
  imageName = 'doublet_detection';
  analysisName = 'SCTK Doublet Finder';

  /* Chart settings */
  containerId = '#donutPlot';
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
    { id: 'startswith', name: ' Starts with: '},
    { id: 'case-ins-eq', name: ' = (case-insensitive) '},
    { id: 'eq', name: ' = (strict) '}
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
  ){
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
      this.donutPlotData = expData;
      //this.preprocessBoxPlotData();
      this.createChart();
    });
    merge(this.sort.sortChange, this.paginator.page)
      .pipe(
        tap(() => {
          this.loadPage();
          //   this.preprocessBoxPlotData();
          this.createChart();
        })
      )
      .subscribe();
  }

  ngOnChanges(): void {
    this.initData();
    //this.initializeFeatureResource();
    //this.customObservationSets = this.metadataService.getCustomObservationSets();
  }

  initData(): void {
    console.log('init data')
    console.log(this.outputs)
    // this.resourceId = this.outputs.qc_results;
    this.resourceId = this.outputs['SctkDoubletFinder.doublet_ids']
    console.log(this.resourceId)


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
    this.dataSource.sampleNames$.subscribe( data => {
        this.dynamicColumns = data
        this.displayColumns = [...this.staticCols, ...data];
      }
    );
    console.log('init data log of datasource')
    console.log(this.dataSource)

  }

  /**
   * Function to construct the parameter filters that are passed to the backend
   */
  createFilters(){
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
    console.log('log from load page')
    console.log(this.dataSource)
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
    if (setSize > this.maxFeatureSetSize){
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
            this.resourceId,
            null,
            null,
            filterValues,
            {}
          )
          .subscribe(features => {
            const elements = features.map(feature => {
              return {id: feature.rowname};
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

  createChart(): void {
    const outerWidth = this.svgElement.nativeElement.offsetWidth;
    const outerHeight = this.outerHeight;
    const width = outerWidth - this.margin.left - this.margin.right;
    const height = outerHeight - this.margin.top - this.margin.bottom;
    //const width = 960;
    //const height = 500;
    const radius = Math.min(width, height) / 2;

    // const data = this.donutPlotData.reduce((a, {name, doublet_class}) => {
    //   a[doublet_class] = a[doublet_class] || 0;
    //   a[doublet_class] += 1;
    //   return a;
    // }, {});
    const data = {singlet:243, doublet:53}
    console.log("donut data")
    console.log(data)
    d3.select(this.containerId)
      .selectAll('svg')
      .remove();

    const svg = d3
      .select(this.containerId)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr(
        'transform',
        'translate(' + width / 2 + ',' + height / 2 + ')'
      )

    const color = d3.scaleOrdinal()
      .range(["#98abc5", "#8a89a6"]);

    const pie = d3.pie()
      .value(d=>d[1]);
    const data_ready = pie(Object.entries(data))

    // // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
    svg
      .selectAll('whatever')
      .data(data_ready)
      .join('path')
      .attr('d', d3.arc()
        .innerRadius(100)         // This is the size of the donut hole
        .outerRadius(radius)
      )
      .attr('fill', d => color(d.data[0]))
      .attr("stroke", "black")
      .style("stroke-width", "2px")
      .style("opacity", 0.7)
  }
}

export interface QCDoubletDetection {
  name: string;
  doublet_class: string;
}

export class ExpressionMatrixDataSource implements DataSource<QCDoubletDetection> {
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
      .subscribe(
        data => {
          this.qcCount = data.count;
          const qcFormatted = data.results.map(
            dataRow => {
              return {
                name: dataRow.rowname,
                doublet_class: dataRow.values["doublet_class"]
              };
            }
          );
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



