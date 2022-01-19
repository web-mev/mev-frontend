import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  ViewChild
} from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { DataSource } from '@angular/cdk/table';
import { BehaviorSubject, Observable, merge } from 'rxjs';
import { AnalysesService } from '@app/features/analysis/services/analysis.service';
import { finalize, tap } from 'rxjs/operators';
import { FormGroup, FormControl } from '@angular/forms';
import { MetadataService } from '@app/core/metadata/metadata.service';
import { AddSampleSetComponent } from '../dialogs/add-sample-set/add-sample-set.component';
import { CustomSetType } from '@app/_models/metadata';

/**
 * Used for TopGO analysis outputs- showing the top terms, allowing selection of feature sets
 */
@Component({
  selector: 'mev-topgo',
  templateUrl: './topgo.component.html',
  styleUrls: ['./topgo.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class TopgoComponent implements OnInit {
  @Input() outputs;
  dataSource: GODataSource; // datasource for MatTable
  resourceId;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  /* Table settings */
  displayedColumns = [
    'go_id',
    'term', 
    'annotated', 
    //'significant', 
    //'expected', 
    //'fisher_rank', 
    'elim_pval', 
    'classic_pval', 
    'actions'
  ];

  operators = [
    { id: 'gte', name: ' >=' },
    { id: 'gt', name: ' > ' },
    { id: 'lte', name: ' <=' },
    { id: 'lt', name: ' < ' }
  ];

  defaultPageIndex = 0;
  defaultPageSize = 10;
  defaultSorting = { field: 'elim_pval', direction: 'asc' };

  /* Table filters */
  allowedFilters = {
    elim_pval: {
      defaultValue: '',
      hasOperator: true,
      operatorDefaultValue: 'lte'
    },
    classic_pval: {
      defaultValue: '',
      hasOperator: true,
      operatorDefaultValue: 'lte'
    }
  };

  filterForm = new FormGroup({});

  constructor(
    private analysesService: AnalysesService,
    public dialog: MatDialog,
    private metadataService: MetadataService
  ) {
    this.dataSource = new GODataSource(this.analysesService);

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
    this.initializeResource();
  }

  ngAfterViewInit() {
    this.sort.sortChange.subscribe(
      () => (this.paginator.pageIndex = this.defaultPageIndex)
    );
    this.dataSource.connect().subscribe(() => {});

    merge(this.sort.sortChange, this.paginator.page)
      .pipe(
        tap(() => {
          this.loadGOTermsPage();
        })
      )
      .subscribe();
  }
  //https://api-dev.tm4.org/api/resources/add94842-bcb4-40ec-9840-bfc8357b3f63/contents/?page=1&page_size=10&sort_vals=[asc]:p-value (Elim method

  ngOnChanges(): void {
    this.initializeResource();
  }

  initializeResource(): void {
    this.resourceId = this.outputs.go_results;
    const sorting = {
      sortField: this.defaultSorting.field,
      sortDirection: this.defaultSorting.direction
    };
    this.dataSource.loadGOTerms(
      this.resourceId,
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
    this.loadGOTermsPage();
  }

  /**
   * Function that is triggered when the user clicks the "Create a custom sample" button
   */
  onCreateFeatureSet(row) {
    console.log('in createFS, row=');
    console.log(row);
    console.log('---------');
    // const features = row.leadingEdge.map(elem => ({
    //   id: elem
    // }));

    // const dialogRef = this.dialog.open(AddSampleSetComponent, {
    //   data: { type: CustomSetType.FeatureSet, name: row.pathway }
    // });

    // dialogRef.afterClosed().subscribe(customSetData => {
    //   if (customSetData) {
    //     const customSet = {
    //       name: customSetData.name,
    //       color: customSetData.color,
    //       type: CustomSetType.FeatureSet,
    //       elements: features,
    //       multiple: true
    //     };

    //     this.metadataService.addCustomSet(customSet);
    //   }
    // });
  }

  /**
   * Function to load pathway list by page, filter and sorting settings specified by a user
   */
  loadGOTermsPage() {
    const formValues = this.filterForm.value; // i.e. {name: "asdfgh", pval_elim: 3, pval_elim_operator: "lte", log2FoldChange: 2, log2FoldChange_operator: "lte"}
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

    this.dataSource.loadGOTerms(
      this.resourceId,
      paramFilter,
      sorting,
      this.paginator.pageIndex,
      this.paginator.pageSize
    );
  }
}

export interface GOTerm {
  go_id: string;
  term: string;
  annotated: number;
  significant: number;
  expected: number;
  //fisher_rank: number;
  classic_pval: number;
  elim_pval: number;
  genelist: string[];
}

export class GODataSource implements DataSource<GOTerm> {
  public goTermsSubject = new BehaviorSubject<GOTerm[]>([]);
  public goTermsCount = 0;
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private analysesService: AnalysesService) {}

  loadGOTerms(
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
      .subscribe(response => {
        this.goTermsCount = response.count;
        return this.goTermsSubject.next(response.results);
      });
  }

  connect(): Observable<GOTerm[]> {
    return this.goTermsSubject.asObservable();
  }

  disconnect(): void {
    this.goTermsSubject.complete();
    this.loadingSubject.complete();
  }
}