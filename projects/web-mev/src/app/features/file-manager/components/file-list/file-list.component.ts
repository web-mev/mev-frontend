import {Component, ElementRef, OnInit, Pipe, PipeTransform, ViewChild, ChangeDetectorRef} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DataSource } from '@angular/cdk/collections';
import { BehaviorSubject, fromEvent, merge, concat, Observable } from 'rxjs';
import { map, debounceTime, distinctUntilChanged, timeout } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';

import { NotificationService } from '@core/core.module';
import { FileService} from '@file-manager/services/file-manager.service';
import { File, FileAdapter } from '@app/shared/models/file';
import { AddDialogComponent } from '@file-manager/components/dialogs/add-dialog/add-dialog.component';
import { EditDialogComponent } from '@file-manager/components/dialogs/edit-dialog/edit-dialog.component';
import { DeleteDialogComponent } from '@file-manager/components/dialogs/delete-dialog/delete-dialog.component';
import { Dropbox, DropboxChooseOptions } from '@file-manager/models/dropbox';
import { ProgressSnackbarComponent } from '../progress-snackbar/progress-snackbar.component';

declare var Dropbox: Dropbox;

@Component({
  selector: 'mev-file-list',
  templateUrl: './file-list.component.html',
  styleUrls: ['./file-list.component.scss']
})
export class FileListComponent implements OnInit {
  displayedColumns = [
    'name',
    'resource_type',
    'status',
    'size',
    'created',
    'workspace',
    'is_active',
    'is_public',
    'actions'
  ];
  exampleDatabase: FileService | null;
  dataSource: ExampleDataSource | null;
  id: string;
  uploadProgressData: Map<string, object>;
  Object = Object;

  constructor(
    public httpClient: HttpClient,
    public dialog: MatDialog,
    public fileService: FileService,
    private adapter: FileAdapter,
    private readonly notificationService: NotificationService,
    public snackBar: MatSnackBar,
    public cd: ChangeDetectorRef
  ) {}

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild('filter', { static: true }) filter: ElementRef;

  ngOnInit() {
    this.loadData();
    this.fileService.fileUploadsProgress.subscribe((uploadProgressData) => {
      this.uploadProgressData = uploadProgressData;

      // refresh table if all files are uploaded
      const allFilesUploaded = Object.keys(uploadProgressData).every(key => uploadProgressData[key].isUploaded);
      if (allFilesUploaded) {
        this.refresh();
      }         
    });
  }

  refresh() {
    this.loadData();
  }

  addItem() {
    const dialogRef = this.dialog.open(AddDialogComponent, {
      data: { file: File }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      
      if (result === 1) {
        // After dialog is closed we're doing frontend updates
        // For add we're just pushing a new row inside FileService
         
        this.exampleDatabase.dataChange.value.push(
          this.fileService.getDialogData()
        );

        // display file upload progress in snackbar
        this.snackBar.openFromComponent(ProgressSnackbarComponent, {
          duration: 0,
          panelClass: 'upload-snackbar',
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        });
       
        //this.refresh();  // issue with refresh when uploading large files

      }
    });
  }

  editItem(i: number, id: string, file_name: string, resource_type: string) {
    this.id = id;
    const dialogRef = this.dialog.open(EditDialogComponent, {
      data: { id: id, name: file_name, resource_type: resource_type }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 1) {
        // When using an edit things are little different, firstly we find record inside FileService by id
        const foundIndex = this.exampleDatabase.dataChange.value.findIndex(
          x => x.id === this.id
        );
        // Then you update that record using data from dialogData (values you entered)
        this.exampleDatabase.dataChange.value[
          foundIndex
          ] = this.fileService.getDialogData();
        // And lastly refresh table
        this.refresh();  // this.refreshTable();
      }
    });
  }

  deleteItem(i: number, id: string, file_name: string, resource_type: string) {
    this.id = id;
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      data: { id: id, name: file_name, resource_type: resource_type }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 1) {
        const foundIndex = this.exampleDatabase.dataChange.value.findIndex(
          x => x.id === this.id
        );
        // for delete we use splice in order to remove single object from FileService
        this.exampleDatabase.dataChange.value.splice(foundIndex, 1);
        this.refresh();  // this.refreshTable();
      }
    });
  }

  private refreshTable() {
    // Material Table updates if you do a pagination or filter update
    this.paginator._changePageSize(this.paginator.pageSize);
  }


  public loadData() {
    this.exampleDatabase = new FileService(
      this.httpClient,
      this.adapter,
      this.notificationService
    );
    this.dataSource = new ExampleDataSource(
      this.exampleDatabase,
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

  addDropBoxItem() {

    const options: DropboxChooseOptions = {
      success: (files) => {
        for (const file of files) {
          const name = file.name;
          const url = file.link;

          this.fileService.addDropboxFile(url);
          this.exampleDatabase.dataChange.value.push(
            // this.fileService.getDialogData()
          );
          this.refresh();
        }
      },
      cancel: () => {
      },
      linkType: 'direct',
      multiselect: false,
      folderselect: false
    };

    Dropbox.choose(options);
  }
}

export class ExampleDataSource extends DataSource<File> {
  _filterChange = new BehaviorSubject('');

  get filter(): string {
    return this._filterChange.value;
  }

  set filter(filter: string) {
    this._filterChange.next(filter);
  }

  filteredData: File[] = [];
  renderedData: File[] = [];

  constructor(
    public _exampleDatabase: FileService,
    public _paginator: MatPaginator,
    public _sort: MatSort
  ) {
    super();
    // Reset to the first page when the user changes the filter.
    this._filterChange.subscribe(() => (this._paginator.pageIndex = 0));
  }

  /** Connect function called by the table to retrieve one stream containing the data to render. */
  connect(): Observable<File[]> {
    // Listen for any changes in the base data, sorting, filtering, or pagination
    const displayDataChanges = [
      this._exampleDatabase.dataChange,
      this._sort.sortChange,
      this._filterChange,
      this._paginator.page
    ];
    this._exampleDatabase.getAllFiles();
      return merge(...displayDataChanges).pipe(
        map(() => {
          // Filter data

          this.filteredData = this._exampleDatabase.data
            .slice()
            .filter((file: File) => {
                const searchStr = (
                  file.name + file.workspace
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

  disconnect() {}

  /** Returns a sorted copy of the database data. */
  sortData(data: File[]): File[] {
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
        case 'name':
          [propertyA, propertyB] = [a.name, b.name];
          break;
        case 'resource_type':
          [propertyA, propertyB] = [a.resource_type, b.resource_type];
          break;
        case 'status':
          [propertyA, propertyB] = [a.status, b.status];
          break;
        case 'workspace':
          [propertyA, propertyB] = [a.workspace, b.workspace];
          break;
        case 'url':
          [propertyA, propertyB] = [a.url, b.url];
          break;
        case 'created':
          [propertyA, propertyB] = [a.created, b.created];
          break;
        case 'size':
          [propertyA, propertyB] = [a.size, b.size];
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
