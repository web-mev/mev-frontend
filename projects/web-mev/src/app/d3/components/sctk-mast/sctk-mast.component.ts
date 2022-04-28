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

  @Component({
    selector: 'mev-mast-dge',
    templateUrl: './sctk-mast.component.html',
    styleUrls: ['../differential_expression/differential_expression.component.scss']
  })
  export class MastDgeComponent implements OnInit, AfterViewInit {
    @Input() outputs;
    dataSource: FeaturesDataSource; // datasource for MatTable
    boxPlotData;
    dgeResourceId;
    analysisName = '';
    imageName = '';
  
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    @ViewChild('boxPlot') svgElement: ElementRef;
  
    /* Table settings */
    displayedColumns = [
      'name',
      'log2FoldChange',
      'pvalue',
      'FDR'
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
    defaultSorting = { field: 'FDR', direction: 'asc' };
  
    // Controls how large a custom FeatureSet can be.
    // Otherwise, clicking the 'add features set' button
    // with a full table could create exceptionally large feature sets
    // (which aren't typically useful anyway)
    maxFeatureSetSize = 500;
  
    /* Table filters */
    allowedFilters = {
      /*name: { defaultValue: '', hasOperator: false },*/
      FDR: {
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
        postfix: 'Exp',
        color: '#f40357'
      },
      Base: {
        label: 'Baseline/Control',
        postfix: 'Base',
        color: '#f4cc03'
      }
    };
    xScale; // scale functions to transform data values into the the range
    yScale;
    customObservationSets: CustomSet[];
  
    constructor(
      private analysesService: AnalysesService,
      public dialog: MatDialog,
      private metadataService: MetadataService,
      private readonly notificationService: NotificationService
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
      this.customObservationSets = this.metadataService.getCustomObservationSets();
    }
  
    initializeFeatureResource(): void {
      this.dgeResourceId = this.outputs['SctkMastDge.mast_output'];
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
     * Function to prepape the outputs data for D3 box plot visualization
     */
    preprocessBoxPlotData() {
        console.log(this.outputs);
        console.log('??????????????????????????????????');

        // the base samples can be undefined in the sense that in a biomarker (one group vs. all)
        // analysis, we do not explicitly 
        const baseSamples = [];
        if ('base_condition_samples' in Object.keys(this.outputs)){ 
            const baseSamples = this.outputs.base_condition_samples.elements.map(
                elem => elem.id
            );
        }

      const experSamples = this.outputs['SctkMastDge.expSamples'].elements.map(
        elem => elem.id
      );
  
      /* The input to the basic dge analysis is two observation sets. To populate that option,
      *  the user would have had to define those. To keep everything consistent, we query
      *  the existing observation sets and compare them to the baseSamples/experSamples. If they
      *  match, then we color the groups based on the colors assigned to those observation sets.
      */
      this.customObservationSets.forEach(
        obsSet => {
          const obsSetSamples = obsSet.elements.map(elem => elem.id);
          if (baseSamples.length > 0 && Utils.stringArraysEquivalent(obsSetSamples, baseSamples)) {
            // matches the baseSamples array
            if(obsSet.color) {
              this.boxPlotTypes.Base.color = obsSet.color
            }
          }
          if (Utils.stringArraysEquivalent(obsSetSamples, experSamples)) {
            // matches the experSamples array
            if(obsSet.color) {
              this.boxPlotTypes.Experimental.color = obsSet.color
            }
          }
        }
      );
  
      // overwrite labels if there are custom names defined by the user
      if (this.outputs['SctkMastDge.baseGroupName']) {
        this.boxPlotTypes.Base.label = this.outputs['SctkMastDge.baseGroupName'];
      }
  
      if (this.outputs['SctkMastDge.expGroupName']) {
        this.boxPlotTypes.Experimental.label = this.outputs['SctkMastDge.expGroupName'];
      }
    }
  
    /**
     * Function that is triggered when the user clicks the "Create a custom sample" button
     */
    onCreateCustomFeatureSet() {
  
      // We don't want to create exceptionally large feature sets. Check
      // that they don't exceed some preset size
      const setSize = this.dataSource.featuresCount;
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
              this.dgeResourceId,
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
            console.log('hoever:', d);
          const htmlTable =
            '<table><thead><th></th><th>' +
            this.boxPlotTypes.Experimental.label +
            '</th><th>' +
            this.boxPlotTypes.Base.label +
            '</th><thead>' +
            '<tr><td>Q1</td><td>' +
            d['q1Exp'].toFixed(this.precision) +
            '</td><td>' +
            d['q1Base'].toFixed(this.precision) +
            '</td></tr>' +
            '<tr><td>Q2</td><td>' +
            d['medianExp'].toFixed(this.precision) +
            '</td><td>' +
            d['medianBase'].toFixed(this.precision) +
            '</td></tr>' +
            '<tr><td>Q3</td><td>' +
            d['q3Exp'].toFixed(this.precision) +
            '</td><td>' +
            d['q3Base'].toFixed(this.precision) +
            '</td></tr>' +
            '<tr><td>IQR</td><td>' +
            d['iqrExp'].toFixed(this.precision) +
            '</td><td>' +
            d['iqrBase'].toFixed(this.precision) +
            '</td></tr>' +
            '<tr><td>MIN</td><td>' +
            d['minExp'].toFixed(this.precision) +
            '</td><td>' +
            d['minBase'].toFixed(this.precision) +
            '</td></tr>' +
            '<tr><td>MAX</td><td>' +
            d['maxExp'].toFixed(this.precision) +
            '</td><td>' +
            d['maxBase'].toFixed(this.precision) +
            '</td></tr>' +
            '</table>';
          return '<b>' + d['name'] + '</b><br>' + htmlTable;
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
        .domain(data.map(d => d.name))
        .paddingInner(1)
        .paddingOuter(0.5);
  
      this.yScale = d3.scaleLinear().rangeRound([height, 0]);
  
      const experMaxVal = d3.max(data, d => <number>d['maxExp']);
      const experMinVal = d3.min(data, d => <number>d['minExp']);
      const baseMaxVal = d3.max(data, d => <number>d['maxBase']);
      const baseMinVal = d3.min(data, d => <number>d['minBase']);
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
        const postfix = this.boxPlotTypes[key].postfix; //e.g. 'Exp'
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
              this.xScale(d['name']) + (1.2 * i - 0.6) * this.boxWidth
          )
          .attr(
            'x2',
            (d: any) =>
              this.xScale(d['name']) + (1.2 * i - 0.6) * this.boxWidth
          )
          .attr('y1', (d: any) => this.yScale(d['min' + postfix]))
          .attr('y2', (d: any) => this.yScale(d['max' + postfix]))
          .attr('stroke', 'black')
          .style('width', 10);
  
        svg
          .selectAll('.boxes')
          .data(data)
          .enter()
          .append('rect')
          .attr(
            'x',
            d => this.xScale(d['name']) + (1.2 * i - 1.1) * this.boxWidth
          )
          .attr('y', d => this.yScale(d['q3' + postfix]))
          .attr(
            'height',
            d => this.yScale(d['q1' + postfix]) - this.yScale(d['q3' + postfix])
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
            d => this.xScale(d['name']) + (1.2 * i - 1.1) * this.boxWidth
          )
          .attr(
            'x2',
            d => this.xScale(d['name']) + (1.2 * i - 0.1) * this.boxWidth
          )
          .attr('y1', d => this.yScale(d['median' + postfix]))
          .attr('y2', d => this.yScale(d['median' + postfix]))
          .attr('stroke', 'black')
          .style('width', 80);
  
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
     * Function to construct the parameter filters that are passed to the backend
     */
    createFilters(){
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
  
      this.dataSource.loadFeatures(
        this.dgeResourceId,
        paramFilter,
        sorting,
        this.paginator.pageIndex,
        this.paginator.pageSize
      );
    }
  }
  
  export interface SingleCellDGEFeature {
    name: string;
    log2FoldChange: number;
    pvalue: number;
    FDR: number;
  }
  
  export class FeaturesDataSource implements DataSource<SingleCellDGEFeature> {
    public featuresSubject = new BehaviorSubject<SingleCellDGEFeature[]>([]);
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
  
    connect(): Observable<SingleCellDGEFeature[]> {
      return this.featuresSubject.asObservable();
    }
  
    disconnect(): void {
      this.featuresSubject.complete();
      this.loadingSubject.complete();
    }
  }
  