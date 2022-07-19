import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DataSource } from '@angular/cdk/collections';
import {
  BehaviorSubject,
  fromEvent,
  merge,
  timer,
  Observable,
  Subscription
} from 'rxjs';
import { map, debounceTime, distinctUntilChanged, takeUntil, filter } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSelect } from '@angular/material/select';

import { NotificationService } from '@core/core.module';
import { FileService } from '@file-manager/services/file-manager.service';
import { File } from '@app/shared/models/file';
import { AddFileDialogComponent } from '@app/features/file-manager/components/dialogs/add-file-dialog/add-file-dialog.component';
import { EditFileDialogComponent } from '@app/features/file-manager/components/dialogs/edit-file-dialog/edit-file-dialog.component';
import { DeleteFileDialogComponent } from '@app/features/file-manager/components/dialogs/delete-file-dialog/delete-file-dialog.component';
import { Dropbox, DropboxChooseOptions } from '@file-manager/models/dropbox';
import { PreviewDialogComponent } from '@app/features/workspace-detail/components/dialogs/preview-dialog/preview-dialog.component';
import { ViewFileTypesDialogComponent } from '../dialogs/view-file-types-dialog/view-file-types-dialog.component';
import { FileType } from '@app/shared/models/file-type';

declare var Dropbox: Dropbox;

/**
 * View File List Component
 *
 * Used to display the list of uploaded files
 */
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
    'format_type',
    'status',
    'size',
    'created',
    'workspace',
    'is_active',
    'is_public',
    'actions'
  ];
  dataSource: ExampleDataSource | null;
  id: string;
  uploadProgressData: Map<string, object>;
  resourceTypeData;
  availableResourceTypes = {};
  acceptableResourceTypes = {};

  // due to the polling nature of the file browser, once a user selects a resource type in the dropdown,
  // we need to keep track of what they did. Otherwise, when the polling feature refreshes the table, the 
  // selection they made disappears. This object tracks this so we can prevent that from happening.
  validatingInfo = {};

  // this allows us to initiate and stop polling behavior when files are being validated. 
  // We track a list of file identifiers (UUID) that are currently being validated by the backend.
  private currentlyValidatingBS: BehaviorSubject<Array<string>> = new BehaviorSubject([]);
  Object = Object;
  private fileUploadProgressSubscription: Subscription = new Subscription();
  isPolling: boolean = false;
  currentSelectedFileType = {};
  formatTypeNeedsChange = {};
  isDropDownOpen: boolean = false;
  isWait: boolean = false;

  constructor(
    public httpClient: HttpClient,
    public dialog: MatDialog,
    public fileService: FileService,
    private readonly notificationService: NotificationService,
    private ref: ChangeDetectorRef,
  ) { }

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild('filter', { static: true }) filter: ElementRef;

  ngOnInit() {
    this.loadData();
    this.loadResourceTypes();

    this.fileUploadProgressSubscription = this.fileService.fileUploadsProgress.subscribe(
      uploadProgressData => {
        this.uploadProgressData = uploadProgressData;

        // show % of upload
        let txt = '';
        let uploadCompletionArray = [];
        for (const key of uploadProgressData.keys()) {
          let info = uploadProgressData.get(key);
          uploadCompletionArray.push(info['isUploaded']);
          const percentUploaded = info['percent'];
          txt += `File ${key} is ${percentUploaded}% uploaded. \n`;
        }
        this.uploadInProgressMsg = txt;
        this.ref.markForCheck();

        // refresh table if all files are uploaded
        if (uploadCompletionArray.every((element) => element)) {
          this.refresh();
          this.uploadInProgressMsg = '';
          this.ref.markForCheck();

          this.checkStatusIsProcessing();
        }
      }
    );

    //Gets data from API to fill File Types Modal
    // tmp hot fix. note the loadResourceTypes function below.
    this.fileService.getResourceTypes().subscribe(res => {
      this.resourceTypeData = res;

      for (let item of res) {
        let key = item.resource_type_key
        let avail = item.acceptable_formats
        this.acceptableResourceTypes[key] = avail
      }
    })
  }

  onOpenDropDown() {
    this.isDropDownOpen = true;
  }

  onCloseDropDown(select: MatSelect) {
    this.isDropDownOpen = false;
  }

  getStatus(row) {
    return row.status
  }

  checkPollingStatus() {
    let polling = true;
    if (this.isDropDownOpen === true) {
      polling = false;
    }
    return polling
  }

  loadResourceTypes() {
    this.fileService.getFileTypes().subscribe((fileTypes: FileType[]) => {
      fileTypes.forEach(
        type =>
        (this.availableResourceTypes[type.resource_type_key] = {
          title: type.resource_type_title
        })
      );
    });
  }

  public ngOnDestroy(): void {
    this.fileUploadProgressSubscription.unsubscribe();
  }

  refresh() {
    this.loadData();
  }

  /*
  * Starts a polling routine which checks for the validation status
  */
  startPollingRefresh(maxSecs: number) {
    // wait 100ms, then emit every 5s
    const intervalSource = timer(100, 5000);

    // only continue this for the number of seconds requested
    const timer$ = timer(maxSecs * 1000);
    const validationListEmpty = this.currentlyValidatingBS.pipe(
      filter(id_list => id_list.length === 0)
    )
    const mergedObservable = merge(timer$, validationListEmpty)

    intervalSource.pipe(
      takeUntil(mergedObservable)
    ).subscribe(
      x => {
        this.isPolling = this.checkPollingStatus()
        if (this.isPolling === true) {
          this.refresh();
        }
      }
    )
  }

  setResourceType($event, row, itemChanged) {
    this.validatingInfo[row.id] = row.resource_type ? row.resource_type : this.currentSelectedFileType[row.id]['fileType'];
    let updateData: any = {}
    if (itemChanged === 'fileTypeAndFormat') {
      updateData = {
        id: row.id,
        resource_type: this.currentSelectedFileType[row.id]['fileType'] ? this.currentSelectedFileType[row.id]['fileType'] : row.resource_type,
        file_format: $event.value
      };
    } else if (itemChanged === 'fileTypeOnly') {
      updateData = {
        id: row.id,
        resource_type: this.currentSelectedFileType[row.id]['fileType'] ? this.currentSelectedFileType[row.id]['fileType'] : row.resource_type
      };
    }
    row.is_active = false;
    this.fileService.updateFile(updateData).subscribe(data => {
      // get the current files being validated and add this new one
      const filesBeingValidated = this.currentlyValidatingBS.value;
      filesBeingValidated.push(data['id']);

      this.currentlyValidatingBS.next(filesBeingValidated);

      this.isPolling = this.checkPollingStatus()
      if (this.isPolling === true) {
        this.refresh()
      }
      this.startPollingRefresh(1200);
    });
  }

  getResourceTypeVal(row) {
    if (row.resource_type) {
      // if the resource was already validated for another type, but we are attempting to
      // change it, this keeps the dropdown on this "new" selected value. Otherwise, the refresh of the table
      // will appear to revert to the old type
      if (Object.keys(this.validatingInfo).includes(row.id)) {
        if (row.is_active) {
          // if we are here, it means that the file has completed validation.
          delete this.validatingInfo[row.id];

          // also need to modify the behaviorsubject that is tracking this file.
          // This will then trigger the polling behavior to cease before the maximum
          // polling time is reached.
          const filesBeingValidated = this.currentlyValidatingBS.value;
          const updatedArray = [];

          // if there are multiple files simultaneously being validated, we 
          // need to ensure we keep those.
          for (const i in filesBeingValidated) {
            const uuid = filesBeingValidated[i];
            if (row.id !== uuid) {
              updatedArray.push(uuid);
            }
          }
          this.currentlyValidatingBS.next(updatedArray);
          return row.resource_type
        } else {
          return this.validatingInfo[row.id];
        }
      }
      // simply return the already-validated resource type.
      return row.resource_type

    } else {
      // the resource type may be null, but we may be in the process of 
      // validating it. Return the value that the user just set, which is 
      // stored in the validatingInfo object

      if (Object.keys(this.validatingInfo).includes(row.id) && row.status === "Validating...") {
        return this.validatingInfo[row.id];
      }
      return '---';
    }
  }

  getFileFormatVal(row) {
    if (row.file_format) {
      // if the resource was already validated for another type, but we are attempting to
      // change it, this keeps the dropdown on this "new" selected value. Otherwise, the refresh of the table
      // will appear to revert to the old type
      if (Object.keys(this.validatingInfo).includes(row.id)) {
        if (row.is_active) {
          // if we are here, it means that the file has completed validation.
          delete this.validatingInfo[row.id];

          // also need to modify the behaviorsubject that is tracking this file.
          // This will then trigger the polling behavior to cease before the maximum
          // polling time is reached.
          const filesBeingValidated = this.currentlyValidatingBS.value;
          const updatedArray = [];

          // if there are multiple files simultaneously being validated, we 
          // need to ensure we keep those.
          for (const i in filesBeingValidated) {
            const uuid = filesBeingValidated[i];
            if (row.id !== uuid) {
              updatedArray.push(uuid);
            }
          }
          this.currentlyValidatingBS.next(updatedArray);

          return row.file_format
        } else {
          return this.validatingInfo[row.id];
        }
      }

      // simply return the already-validated resource type.
      return row.file_format

    } else {
      // the resource type may be null, but we may be in the process of 
      // validating it. Return the value that the user just set, which is 
      // stored in the validatingInfo object
      if (Object.keys(this.validatingInfo).includes(row.id) && row.status === "Validating...") {
        return this.validatingInfo[row.id];
      }
      return '---';
    }
  }

  setFileType($event, row) {
    let id = row.id;
    let selectedFileType = $event.value;
    let obj = {}
    obj["fileType"] = selectedFileType
    this.currentSelectedFileType[id] = obj;
    if (!this.acceptableResourceTypes[selectedFileType].some(item => item.key === row.file_format)) {
      this.formatTypeNeedsChange[id] = true;
    }
    if (row.resource_type && row.status === '' && this.acceptableResourceTypes[selectedFileType].some(item => item.key === row.file_format)) {
      this.setResourceType($event, row, 'fileTypeOnly')
    }
  }

  setFormatType($event, row) {
    let id = row.id;
    this.formatTypeNeedsChange[id] = false;
    this.setResourceType($event, row, 'fileTypeAndFormat')
  }

  /**
   * Open a modal dialog to upload files
   *
   */
  addItem() {
    const dialogRef = this.dialog.open(AddFileDialogComponent, {
      data: { file: File }
    });

    dialogRef.afterClosed().subscribe(() => { });
  }

  /**
   * Open Dropbox pop-up window to add files from Dropbox
   *
   */
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
          this.isPolling = this.checkPollingStatus()
          if (this.isPolling === true) {
            this.refresh()
          }
        });
      },
      cancel: () => { },
      linkType: 'direct',
      multiselect: true,
      folderselect: false
    };
    Dropbox.choose(options);
  }

  /**
   * Open a modal dialog to edit file properties
   *
   */
  editItem(i: number, id: string, file_name: string, resource_type: string, file_format: string) {
    this.id = id;

    const dialogRef = this.dialog.open(EditFileDialogComponent, {
      data: { id: id, name: file_name, resource_type: resource_type, file_format: file_format },
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result !== null) {
        this.dataSource.renderedData[i]['is_active'] = false;
        this.dataSource.renderedData[i]['status'] = 'Validating...';
        this.validatingInfo[id] = resource_type;

        // get the current files being validated and add this new one
        const filesBeingValidated = this.currentlyValidatingBS.value;
        filesBeingValidated.push(id);
        this.currentlyValidatingBS.next(filesBeingValidated);

        this.startPollingRefresh(120);
      }
    });
  }

  /**
   * Open a modal dialog to view detailed information about the available file types and their formats
   *
   */
  viewFileTypes() {
    this.dialog.open(ViewFileTypesDialogComponent, { data: this.resourceTypeData });
  }

  /**
   * Open a modal dialog to preview file
   *
   */
  previewItem(fileId: string) {
    this.isWait = true;
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
      this.isWait = false;
      this.ref.markForCheck();
      this.dialog.open(PreviewDialogComponent, {
        data: {
          previewData: previewData
        }
      });
    },
      error => {
        // error was already reported to the user--
        this.isWait = false;
        this.ref.markForCheck();
      });
  }

  /**
   * Open a modal dialog to delete a file
   *
   */
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
        // add a delay to the refresh. Otherwise the record deletion and request for
        // updated files ends up as a race condition and often the refresh still shows
        // the deleted file. This is not a 100% fix, but the delete/commit should complete
        // with sufficient time before the refresh request is triggered.
        setTimeout(() => this.refresh(), 2000);
      }
    });
  }

  public loadData() {
    if (this.dataSource) {
      this.dataSource.connect();
    } else {
      this.dataSource = new ExampleDataSource(
        this.fileService,
        this.paginator,
        this.sort
      );
    }
    fromEvent(this.filter.nativeElement, 'keyup')
      .pipe(debounceTime(150), distinctUntilChanged())
      .subscribe(() => {
        if (!this.dataSource) {
          return;
        }
        this.dataSource.filter = this.filter.nativeElement.value;
      });
  }

  //Refreshes UI every 5s if Status is "Processing" to get it to load the next state
  checkStatusIsProcessing() {
    const source = timer(1000, 5000);
    let processingTimer = source.subscribe(val => {
      let isProcessing = false;
      for (let index in this.dataSource.renderedData) {
        let row = this.dataSource.renderedData[index]
        if (row.status === "Processing...") {
          this.refresh();
          isProcessing = true;
        }
      }
      if (isProcessing === false) {
        this.refresh();
        processingTimer.unsubscribe()
      }
    })
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

  /**
   * Connect function called by the table to retrieve one stream containing the data to render.
   */
  connect(): Observable<File[]> {

    // Listen for any changes in the base data, sorting, filtering, or pagination
    const displayDataChanges = [
      this._exampleDatabase.dataChange,
      this._sort.sortChange,
      this._filterChange,
      this._paginator.page
    ];
    this._exampleDatabase.getAllFilesPolledFileList();

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

  disconnect() { }

  /**
   * Returns a sorted copy of the database data.
   *
   */
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
