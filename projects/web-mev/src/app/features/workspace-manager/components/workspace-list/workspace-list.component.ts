import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DataSource } from '@angular/cdk/collections';
import { BehaviorSubject, fromEvent, merge, Observable } from 'rxjs';
import { map, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

import { WorkspaceService } from '@workspace-manager/services/workspace.service';
import { Workspace } from '@workspace-manager/models/workspace';
import { AddWSDialogComponent } from '@app/features/workspace-manager/components/dialogs/add-ws-dialog/add-ws-dialog.component';
import { EditWSDialogComponent } from '@app/features/workspace-manager/components/dialogs/edit-ws-dialog/edit-ws-dialog.component';
import { DeleteWSDialogComponent } from '@app/features/workspace-manager/components/dialogs/delete-ws-dialog/delete-ws-dialog.component';

@Component({
  selector: 'mev-workspace-list',
  templateUrl: './workspace-list.component.html',
  styleUrls: ['./workspace-list.component.scss']
})
export class WorkspaceListComponent implements OnInit {
  displayedColumns = [
    'workspace_name',
    'created',
    'actions'
  ];
  dataSource: ExampleDataSource | null;
  id: string;

  constructor(
    public httpClient: HttpClient,
    public dialog: MatDialog,
    public workspaceService: WorkspaceService
  ) { }

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild('filter', { static: true }) filter: ElementRef;

  ngOnInit() {
    this.loadData();
  }

  refresh() {
    this.loadData();
  }

  addItem() {
    const dialogRef = this.dialog.open(AddWSDialogComponent, {
      data: { workspace: Workspace }
    });

    dialogRef.afterClosed().subscribe(result => {
      let timeout = (result === 1) ? 300 : 1000;
      setTimeout(() => {
        this.refresh();
      }, timeout)
    });
  }

  editItem(i: number, id: string, workspace_name: string) {
    this.id = id;
    const dialogRef = this.dialog.open(EditWSDialogComponent, {
      data: { id: id, workspace_name: workspace_name }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 1) {
        setTimeout(() => {
          this.refresh();
        }, 300)
      }
    });
  }

  deleteItem(i: number, id: string, workspace_name: string) {
    this.id = id;
    const dialogRef = this.dialog.open(DeleteWSDialogComponent, {
      data: { id: id, workspace_name: workspace_name }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 1) {
        setTimeout(() => {
          this.refresh();
        }, 300)
      }
    });
  }

  public loadData() {
    this.dataSource = new ExampleDataSource(
      this.workspaceService,
      this.paginator,
      this.sort
    );
    fromEvent(this.filter.nativeElement, 'keyup')
      .pipe(debounceTime(150), distinctUntilChanged())
      .subscribe(() => {
        if (!this.dataSource) {
          return;
        }
        this.dataSource.filter = this.filter.nativeElement.value;
      });

  }
}

export class ExampleDataSource extends DataSource<Workspace> {
  _filterChange = new BehaviorSubject('');

  get filter(): string {
    return this._filterChange.value;
  }

  set filter(filter: string) {
    this._filterChange.next(filter);
  }

  filteredData: Workspace[] = [];
  renderedData: Workspace[] = [];

  constructor(
    public _exampleDatabase: WorkspaceService,
    public _paginator: MatPaginator,
    public _sort: MatSort
  ) {
    super();
    // Reset to the first page when the user changes the filter.
    this._filterChange.subscribe(() => (this._paginator.pageIndex = 0));
  }

  /** Connect function called by the table to retrieve one stream containing the data to render. */
  connect(): Observable<Workspace[]> {
    // Listen for any changes in the base data, sorting, filtering, or pagination
    const displayDataChanges = [
      this._exampleDatabase.dataChange,
      this._sort.sortChange,
      this._filterChange,
      this._paginator.page
    ];

    this._exampleDatabase.getAllWorkspaces();

    return merge(...displayDataChanges).pipe(
      map(() => {
        // Filter data
        this.filteredData = this._exampleDatabase.data
          .slice()
          .filter((workspace: Workspace) => {
            const searchStr = (
              workspace.id + workspace.workspace_name
            ).toLowerCase();
            return searchStr.indexOf(this.filter.toLowerCase()) !== -1;
          });

        // Sort filtered data
        const sortedData = this.sortData(this.filteredData.slice());

        // Grab the page's slice of the filtered sorted data.
        const startIndex = this._paginator.pageIndex * this._paginator.pageSize;
        this.renderedData = sortedData.splice(
          startIndex,
          this._paginator.pageSize
        );
        return this.renderedData;
      })
    );
  }

  disconnect() { }

  /** Returns a sorted copy of the database data. */
  sortData(data: Workspace[]): Workspace[] {
    if (!this._sort.active || this._sort.direction === '') {
      return data;
    }

    return data.sort((a, b) => {
      let propertyA: number | string | Date = '';
      let propertyB: number | string | Date = '';

      switch (this._sort.active) {
        case 'id':
          [propertyA, propertyB] = [a.id, b.id];
          break;
        case 'workspace_name':
          [propertyA, propertyB] = [a.workspace_name, b.workspace_name];
          break;
        case 'url':
          [propertyA, propertyB] = [a.url, b.url];
          break;
        case 'created':
          [propertyA, propertyB] = [a.created, b.created];
          break;
      }

      const valueA = isNaN(+propertyA) ? propertyA : +propertyA;
      const valueB = isNaN(+propertyB) ? propertyB : +propertyB;

      return (
        (valueA < valueB ? -1 : 1) * (this._sort.direction === 'asc' ? 1 : -1)
      );
    });
  }
}
