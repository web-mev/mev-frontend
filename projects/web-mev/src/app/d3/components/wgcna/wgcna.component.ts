import {
  Component,
  ChangeDetectionStrategy,
  Input,
  OnInit,
  ViewChild,
  AfterViewInit
} from '@angular/core';
import { BehaviorSubject, Observable, merge } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
import { DataSource } from '@angular/cdk/table';
import { MatPaginator } from '@angular/material/paginator';
import { AnalysesService } from '@app/features/analysis/services/analysis.service';

export interface WGCNAModule {
  module_name: string;
  module_genes: string[];
  module_size: number;
}

/**
 * Used for WGCNA output where we have both gene modules
 * and a QC plot
 */
@Component({
  selector: 'mev-wgcna',
  templateUrl: './wgcna.component.html',
  styleUrls: ['./wgcna.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class WgcnaComponent implements OnInit, AfterViewInit {
  @Input() outputs;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  analysisName = 'WGCNA';
  dataSource: WGCNADataSource;

  displayedColumns = ['module_id','module_size', 'actions'];
  defaultPageIndex = 0;
  defaultPageSize = 10;

  constructor(
    private analysesService: AnalysesService,
  ) {
    this.dataSource = new WGCNADataSource(this.analysesService);
  }

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
   this.dataSource.loadData(
     this.outputs['module_results'],
     {},
     {},
     this.defaultPageIndex,
     this.defaultPageSize
     );
  }

  ngAfterViewInit() {

    this.paginator.page.subscribe(
      () => {
        this.dataSource.loadData(
          this.outputs['module_results'],
          {},
          {},
          this.paginator.pageIndex,
          this.paginator.pageSize
          );
      }
    );
  }

  createFeatureSet(row){
    console.log('Create FS!');
    console.log(row);
  } 
}


export class WGCNADataSource implements DataSource<WGCNAModule> {
  public modulesSubject = new BehaviorSubject<WGCNAModule[]>([]);
  public modulesCount = 0;
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
      .subscribe(response => {
        this.modulesCount = response.count;
        let reformattedData = response.results.map(
          r => {
            let n = r.genes.length;
            return {
              module_name: r.module,
              module_genes: r.genes,
              module_size: n
            }
          }
        );
        return this.modulesSubject.next(reformattedData);
      });
  }

  connect(): Observable<WGCNAModule[]> {
    return this.modulesSubject.asObservable();
  }

  disconnect(): void {
    this.modulesSubject.complete();
    this.loadingSubject.complete();
  }
}