import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DataSource } from '@angular/cdk/collections';
import {
  BehaviorSubject,
  fromEvent,
  merge,
  Observable,
  Subscription
} from 'rxjs';
import { map, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

import { NotificationService } from '@core/core.module';
import { FileService } from '@file-manager/services/file-manager.service';
import { File, FileAdapter } from '@app/shared/models/file';
import { AddFileDialogComponent } from '@app/features/file-manager/components/dialogs/add-file-dialog/add-file-dialog.component';
import { EditFileDialogComponent } from '@app/features/file-manager/components/dialogs/edit-file-dialog/edit-file-dialog.component';
import { DeleteFileDialogComponent } from '@app/features/file-manager/components/dialogs/delete-file-dialog/delete-file-dialog.component';
import { Dropbox, DropboxChooseOptions } from '@file-manager/models/dropbox';
import { AnalysesService } from '@app/features/analysis/services/analysis.service';
import { PreviewDialogComponent } from '@app/features/workspace-detail/components/dialogs/preview-dialog/preview-dialog.component';
import { ViewFileTypesDialogComponent } from '../dialogs/view-file-types-dialog/view-file-types-dialog.component';

declare var Dropbox: Dropbox;

@Component({
  selector: 'mev-file-list',
  templateUrl: './file-list.component.html',
  styleUrls: ['./file-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FileListComponent implements OnInit {
  dropboxUploadInProgressMsg = '';
  dropboxUploadCompleteMsg =
    'File(s) uploaded successfully. Please assign the specific type for the file(s) uploaded.';
  uploadInProgressMsg = '';

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
  private fileUploadProgressSubscription: Subscription = new Subscription();

  constructor(
    public httpClient: HttpClient,
    public dialog: MatDialog,
    public fileService: FileService,
    private adapter: FileAdapter,
    private readonly notificationService: NotificationService,
    private readonly analysesService: AnalysesService,
    private ref: ChangeDetectorRef
  ) {}

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild('filter', { static: true }) filter: ElementRef;

  ngOnInit() {
    this.loadData();

    this.fileUploadProgressSubscription = this.fileService.fileUploadsProgress.subscribe(
      uploadProgressData => {
        this.uploadProgressData = uploadProgressData;

        // show % of upload
        let txt = '';
        for (const key of Object.keys(uploadProgressData)) {
          txt += `File ${key} is ${uploadProgressData[key].percent}% uploaded. \n`;
        }
        this.uploadInProgressMsg = txt;
        this.ref.markForCheck();

        // refresh table if all files are uploaded
        const allFilesUploaded = Object.keys(uploadProgressData).every(
          key => uploadProgressData[key].isUploaded
        );
        if (allFilesUploaded) {
          this.refresh();
          this.uploadInProgressMsg = '';
          this.ref.markForCheck();
        }
      }
    );
  }

  public ngOnDestroy(): void {
    this.fileUploadProgressSubscription.unsubscribe();
  }

  refresh() {
    this.loadData();
  }

  addItem() {
    const dialogRef = this.dialog.open(AddFileDialogComponent, {
      data: { file: File }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 1) {
        // After dialog is closed we're doing frontend updates
        // For add we're just pushing a new row inside FileService

        this.exampleDatabase.dataChange.value.push(
          this.fileService.getDialogData()
        );
      }
    });
  }

  addDropBoxItem() {
    const options: DropboxChooseOptions = {
      success: files => {
        const fileNames = files.map(file => file.name).join("' ,'");
        this.dropboxUploadInProgressMsg = `Uploading file(s) '${fileNames}' from Dropbox...`;
        this.ref.markForCheck();
        const filesToUpload = files.map(file => ({
          download_link: file.link,
          filename: file.name
        }));
        this.fileService.addDropboxFile(filesToUpload).subscribe(data => {
          this.notificationService.success(this.dropboxUploadCompleteMsg);
          this.dropboxUploadInProgressMsg = '';
          this.ref.markForCheck();
          this.refresh();
        });
      },
      cancel: () => {},
      linkType: 'direct',
      multiselect: true,
      folderselect: false
    };
    Dropbox.choose(options);
  }

  editItem(i: number, id: string, file_name: string, resource_type: string) {
    this.id = id;
    const dialogRef = this.dialog.open(EditFileDialogComponent, {
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
        this.refresh();
      }
    });
  }

  viewFileTypes() {
    const dialogRef = this.dialog.open(ViewFileTypesDialogComponent);
  }

  previewItem(fileId: string) {
    this.fileService.getFilePreview(fileId).subscribe(data => {
      const previewData = {};
      if (data?.results?.length && 'rowname' in data.results[0]) {
        const minN = Math.min(data.results.length, 10);
        let slicedData = data.results.slice(0, minN);
        const columns = Object.keys(slicedData[0].values);
        const rows = slicedData.map(elem => elem.rowname);
        const values = slicedData.map(elem => {
          let rowValues = [];
          const elemValues = elem.values;
          columns.forEach(col => rowValues.push(elemValues[col]));
          return rowValues;
        });
        previewData['columns'] = columns;
        previewData['rows'] = rows;
        previewData['values'] = values;
      }

      const dialogRef = this.dialog.open(PreviewDialogComponent, {
        data: {
          previewData: previewData
        }
      });
    });
  }

  deleteItem(
    i: number,
    id: string,
    file_name: string,
    readable_resource_type: string
  ) {
    this.id = id;
    const dialogRef = this.dialog.open(DeleteFileDialogComponent, {
      data: {
        id: id,
        name: file_name,
        readable_resource_type: readable_resource_type
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 1) {
        const foundIndex = this.exampleDatabase.dataChange.value.findIndex(
          x => x.id === this.id
        );
        // for delete we use splice in order to remove single object from FileService
        this.exampleDatabase.dataChange.value.splice(foundIndex, 1);
        this.refresh();
      }
    });
  }

  public loadData() {
    this.exampleDatabase = new FileService(
      this.httpClient,
      this.adapter,
      this.analysesService
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
            const searchStr = (file.name + file.workspaces).toLowerCase();
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
      let propertyA: any = '';
      let propertyB: any = '';

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
          [propertyA, propertyB] = [a.workspaces, b.workspaces];
          break;
        case 'url':
          [propertyA, propertyB] = [a.url, b.url];
          break;
        case 'created':
          [propertyA, propertyB] = [new Date(a.created), new Date(b.created)];
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
