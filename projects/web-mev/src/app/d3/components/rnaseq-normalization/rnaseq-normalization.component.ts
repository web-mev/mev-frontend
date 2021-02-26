import {
    Component,
    OnInit,
    ChangeDetectionStrategy,
    ViewChild,
    AfterViewInit,
    Input
} from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { BehaviorSubject, Observable, merge } from 'rxjs';
import { DataSource } from '@angular/cdk/table';
import { tap, finalize } from 'rxjs/operators';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { AnalysesService } from '@app/features/analysis/services/analysis.service';
import { NotificationService } from '../../../core/core.module';

@Component({
  selector: 'mev-rnaseq-normalization',
  templateUrl: './rnaseq-normalization.component.html',
  styleUrls: ['./rnaseq-normalization.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default

})
export class RnaSeqNormalizationComponent implements OnInit, AfterViewInit  {
    @Input() outputs;
    dataSource: ExpressionMatrixDataSource; // datasource for MatTable
    resourceId;
    boxPlotData;
  
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    imageName = 'normalized_counts';
    analysisName = 'RNA-seq normalization';

    // Controls how large a custom FeatureSet can be.
    // Otherwise, clicking the 'add features set' button
    // with a full table could create exceptionally large feature sets
    // (which aren't typically useful anyway)
    maxFeatureSetSize = 500;

    /* Table settings */
    staticCols = ['name', 'meanExp'];
    dynamicColumns; // will be filled further by dataSource
    displayColumns; // will be the concatenation of static + dynamic cols

    operators = [
        { id: 'eq', name: ' = ' },
        { id: 'gte', name: ' >=' },
        { id: 'gt', name: ' > ' },
        { id: 'lte', name: ' <=' },
        { id: 'lt', name: ' < ' }
    ];

    defaultPageIndex = 0;
    defaultPageSize = 10;
    defaultSorting = { field: 'meanExp', direction: 'desc' };

    /* Table filters */
    allowedFilters = {
        /*name: { defaultValue: '', hasOperator: false },*/
        geneName: {
            defaultValue: '',
            hasOperator: false
        },
        // meanExp: {
        //     defaultValue: 0,
        //     hasOperator: true,
        //     operatorDefaultValue: 'gte'
        // }
    };

    filterForm = new FormGroup({});

    constructor(
        private analysesService: AnalysesService,
        //public dialog: MatDialog,
        //private metadataService: MetadataService,
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
    
    ngOnChanges(): void {
        this.initData();
    }

    ngAfterViewInit() {

        this.sort.sortChange.subscribe(
          () => (this.paginator.pageIndex = this.defaultPageIndex)
        );
        this.dataSource.connect().subscribe(expData => {
          this.boxPlotData = expData;
          //this.preprocessBoxPlotData();
          //this.createChart();
        });
        merge(this.sort.sortChange, this.paginator.page)
          .pipe(
            tap(() => {
               this.loadPage();
            //   this.preprocessBoxPlotData();
            //   this.createChart();
            })
          )
          .subscribe();
      }

    initData(): void {
        this.resourceId = this.outputs.normalized_counts;
        const sorting = {
            sortField: this.defaultSorting.field,
            sortDirection: this.defaultSorting.direction
        };
        this.dataSource.loadData(
            this.resourceId,
            {},
            // sorting,
            {},
            this.defaultPageIndex,
            this.defaultPageSize
        );
        this.dataSource.sampleNames$.subscribe( data => {
                this.dynamicColumns = data
                this.displayColumns = [...this.staticCols, ...data];
            }
        );
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

    loadPage() {
        const paramFilter = this.createFilters();

        const sorting = {
          sortField: this.sort.active,
          sortDirection: this.sort.direction
        };

        this.dataSource.loadData(
            this.resourceId,
            paramFilter,
            // sorting,
            {},
            this.paginator.pageIndex,
            this.paginator.pageSize
        );
    }

    /**
     * Function is triggered when submitting the form with table filters
     */
    onSubmit() {
        this.paginator.pageIndex = this.defaultPageIndex;
        this.loadPage();
    }

    onCreateCustomFeatureSet() {
    }

}

export interface GeneExpression {
    //each row of the table has a gene symbol/name and some expression values
    // We need to associate each sample ID with its expression value for that gene
    // (hence the Map)
    geneName: string;
    meanExp: number;
    expressions: Map<string, number>; 
}

export class ExpressionMatrixDataSource implements DataSource<GeneExpression> {
    public expSubject = new BehaviorSubject<GeneExpression[]>([]);
    public expCount = 0;
    private sampleNamesSubject = new BehaviorSubject<string[]>([]);
    public sampleNames$ = this.sampleNamesSubject.asObservable();
    private loadingSubject = new BehaviorSubject<boolean>(false);
    public loading$ = this.loadingSubject.asObservable();
    private precision = 2;
    constructor(private analysesService: AnalysesService) {}
  
    loadData(
        resourceId: string,
        filterValues: object,
        sorting: object,
        pageIndex: number,
        pageSize: number
    ) 
    {
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
                this.expCount = data.count;
                const expFormatted = data.results.map(
                    dataRow => {
                        const truncated_expressions = {};
                        Object.keys(dataRow.values).forEach( k=>
                            truncated_expressions[k] = dataRow.values[k].toFixed(this.precision)
                        );
                        return {
                            geneName: dataRow.rowname,
                            meanExp: 0,
                            expressions: truncated_expressions
                        };
                    }
                );
                // extract the sample names to populate the columns
                this.sampleNamesSubject.next(Object.keys(expFormatted[0].expressions));
                return this.expSubject.next(expFormatted);
            }
        );
    }
  
    connect(): Observable<GeneExpression[]> {
      return this.expSubject.asObservable();
    }
  
    disconnect(): void {
      this.expSubject.complete();
      this.loadingSubject.complete();
    }
  }