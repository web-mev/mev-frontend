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
import { AddSampleSetComponent } from '../../dialogs/add-sample-set/add-sample-set.component';
import { CustomSetType } from '@app/_models/metadata';

@Component({
  selector: 'mev-gsea',
  templateUrl: './gsea.component.html',
  styleUrls: ['./gsea.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class GseaComponent implements OnInit {
  @Input() outputs;
  dataSource: PathwayDataSource; // datasource for MatTable
  gseaResourceId;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  /* Table settings */
  displayedColumns = [
    'pathway',
    'ranks',
    'pval',
    'padj',
    'NES',
    'featureSetCreation',
    'topGeneView'
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
  defaultSorting = { field: 'pathway', direction: 'asc' };

  /* Table filters */
  allowedFilters = {
    padj: {
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
    this.dataSource = new PathwayDataSource(this.analysesService);

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
          this.loadPathwaysPage();
        })
      )
      .subscribe();
  }

  ngOnChanges(): void {
    this.initializeResource();
  }

  initializeResource(): void {
    this.gseaResourceId = this.outputs.pathway_results;
    const sorting = {
      sortField: this.defaultSorting.field,
      sortDirection: this.defaultSorting.direction
    };
    this.dataSource.loadPathways(
      this.gseaResourceId,
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
    this.loadPathwaysPage();
  }

  /**
   * Function that is triggered when the user clicks the "Create a custom sample" button
   */
  onCreateFeatureSet(row) {
    const features = row.leadingEdge.map(elem => ({
      id: elem
    }));

    const dialogRef = this.dialog.open(AddSampleSetComponent, {
      data: { type: CustomSetType.FeatureSet, name: row.pathway }
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
   * Function that is triggered when the user clicks the "Show top genes" button to view box plots
   */
  onShowTopGenes(row) {
    // const features = ["ECHS1", "ADH5P2", "LAPTM4B", "MMGT1"]; // row.leadingEdge
  }

  /**
   * Function to load pathway list by page, filter and sorting settings specified by a user
   */
  loadPathwaysPage() {
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

    this.dataSource.loadPathways(
      this.gseaResourceId,
      paramFilter,
      sorting,
      this.paginator.pageIndex,
      this.paginator.pageSize
    );
  }
}

export interface Pathway {
  pathway: string;
  pval: number;
  padj: number;
  log2err: number;
  ES: number;
  NES: number;
  size: number;
  ranks: number[];
}

export class PathwayDataSource implements DataSource<Pathway> {
  public pathwaysSubject = new BehaviorSubject<Pathway[]>([]);
  public pathwaysCount = 0;
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private analysesService: AnalysesService) {}

  loadPathways(
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
        this.pathwaysCount = response.count;
        return this.pathwaysSubject.next(response.results);
      });
  }

  connect(): Observable<Pathway[]> {
    return this.pathwaysSubject.asObservable();
  }

  disconnect(): void {
    this.pathwaysSubject.complete();
    this.loadingSubject.complete();
  }
}
