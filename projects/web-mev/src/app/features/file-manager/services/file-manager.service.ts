import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, timer, forkJoin } from 'rxjs';
import { HttpClient, HttpEventType, HttpParams } from '@angular/common/http';
import {
  map,
  switchMap,
  takeWhile,
  concatMap,
  takeUntil
} from 'rxjs/operators';
import { File, FileAdapter } from '@app/shared/models/file';
import { environment } from '@environments/environment';
import { FileType } from '@app/shared/models/file-type';
import { AnalysesService } from '@app/features/analysis/services/analysis.service';
import { NotificationService } from '@app/core/core.module';

/**
 * File service
 *
 * Used for operations with file in the File Manager
 */
@Injectable({
  providedIn: 'root'
})
export class FileService {
  private readonly API_URL = environment.apiUrl;
  private readonly FILE_VALIDATION_PROGRESS_STATUSES = [
    'Validating...',
    'Processing...'
  ];
  private maxTime = 20000; //  check the file validation status only for the first 20 secs

  dataChange: BehaviorSubject<File[]> = new BehaviorSubject<File[]>([]);

  public fileUploadsProgress: BehaviorSubject<
    Map<string, object>
  > = new BehaviorSubject<Map<string, object>>(new Map<string, object>());

  // Temporarily stores data from dialogs
  dialogData: any;

  constructor(
    private httpClient: HttpClient,
    private adapter: FileAdapter,
    private analysesService: AnalysesService,
    private notificationService: NotificationService
  ) {}

  get data(): File[] {
    return this.dataChange.getValue();
  }

  getDialogData() {
    return this.dialogData;
  }

  /**
   * Get file resource list
   *
   */
  getFileTypes(): Observable<FileType[]> {
    return this.httpClient.get<FileType[]>(`${this.API_URL}/resource-types/`);
  }

  /**
   * 
   * tmp hotfix
   */
  getResourceTypes(): Observable<any> {
    return this.httpClient.get(`${this.API_URL}/resource-types/`);
  }

  /**
   * Get file list
   *
   */
  public getAllFiles(): void {
    this.httpClient.get(`${this.API_URL}/resources/`).pipe(
      map((files: File[]) => files.map(file => this.adapter.adapt(file)))    
    ).subscribe(data => {
      this.dataChange.next(data);
    })
  }

  /**
   * File info retrieval using polling
   *
   */
  public getAllFilesPolled(): void {
    // refresh the status of the resource validation process every 5 seconds
    const maxTimer$ = timer(this.maxTime);
    timer(0, 5000)
      .pipe(
        concatMap(() => this.httpClient.get(`${this.API_URL}/resources/`)),
        map((files: File[]) => files.map(file => this.adapter.adapt(file))),
        takeWhile(
          files =>
            files.some(file => {
              let file_is_inactive = !(file.is_active);
              let waiting =  this.FILE_VALIDATION_PROGRESS_STATUSES.includes(file.status);
              return (file_is_inactive || waiting)
            }
            ),
          true
        ),
        takeUntil(maxTimer$)
      )
      .subscribe(data => {
        this.dataChange.next(data);
      });
  }

  //For the file-list.component, need a shorter max time of 5s in order to not refresh whole table for the first 20s and close dropdown menu
  public getAllFilesPolledFileList(): void {
    // refresh the status of the resource validation process every 5 seconds
    let maxTime2 = 5000;
    const maxTimer$ = timer(maxTime2);
    timer(0, 5000)
      .pipe(
        concatMap(() => this.httpClient.get(`${this.API_URL}/resources/`)),
        map((files: File[]) => files.map(file => this.adapter.adapt(file))),
        takeWhile(
          files =>
            files.some(file => {
              let file_is_inactive = !(file.is_active);
              let waiting =  this.FILE_VALIDATION_PROGRESS_STATUSES.includes(file.status);
              return (file_is_inactive || waiting)
            }
            ),
          true
        ),
        takeUntil(maxTimer$)
      )
      .subscribe(data => {
        this.dataChange.next(data);
      });
  }

  /**
   * Add file, post method
   *
   * Execute the uploads sequentially, because uploading multiple files could potentially tie-up
   * the server since a bunch of threads would be busy ingesting the data for a long time
   */
  addFile(files: any[]): void {
    const fileUploadsProgressMap = new Map<string, object>();

    for (let i = 0; i < files.length; i++) {
      fileUploadsProgressMap.set(files[i].name,{ percent: 0, isUploaded: false });
    }
    this.fileUploadsProgress.next(fileUploadsProgressMap);

    for (let i = 0; i < files.length; i++) {
      const formData = new FormData();
      formData.set('upload_file', files[i], files[i].name);

      this.httpClient
        .post(`${this.API_URL}/resources/upload/`, formData, {
          reportProgress: true,
          observe: 'events'
        })
        .subscribe(event => {
          switch (event.type) {
            case HttpEventType.UploadProgress:
              const percentDone = Math.round(
                (event.loaded * 100) / event.total
              );
              fileUploadsProgressMap.set(files[i].name, {
                percent: percentDone,
                isUploaded: false
              });
              this.fileUploadsProgress.next(fileUploadsProgressMap);
              break;
            case HttpEventType.Response:
              fileUploadsProgressMap.set(files[i].name, {
                percent: 100,
                isUploaded: true
              });
              this.fileUploadsProgress.next(fileUploadsProgressMap);
          }
        }, err => {
          fileUploadsProgressMap.delete(files[i].name);
          this.fileUploadsProgress.next(fileUploadsProgressMap); 
        }
        );
    }
  }

  /**
   * Add file, post method for Dropbox upload
   *
   */
  addDropboxFile(files): Observable<any> {
    return this.httpClient
      .post(`${this.API_URL}/resources/dropbox-upload/`, files)
      .pipe(
        switchMap(response => {
          return forkJoin(
            response['upload_ids'].map(execOperationId =>
              this.analysesService.getExecutedOperationResult(execOperationId)
            )
          );
        })
      );
  }

  /**
   * Update file properties, put method
   *
   */
  updateFile(file: File): Observable<any> {
    return this.httpClient
      .put(`${this.API_URL}/resources/${file.id}/`, file)
  }

  /**
   * Delete file
   *
   */
  deleteFile(id: number | string): void {
    this.httpClient.delete(`${this.API_URL}/resources/${id}/`).subscribe(
      x=>{},
      err => {
        // if the backend returns a 403, then it means the file couldn't be deleted because it was "used"
        // by an analysis or used in a workspace
        // Requests for deleting another user's files (unlikely since they don't SEE those) or other
        // problems with a deletion requests return a 400 error
        if (err.status === 403){
          this.notificationService.warn('You cannot delete this file since it has been used in an analysis or \
            is currently associated with one or more of your workspaces. We do this to preserve the integrity \
             of analysis workflows in WebMeV.');
        } else {
          this.notificationService.warn('File deletion failed.');
        }

      }
    );
  }

  /**
   * Preview file content
   *
   * Display only the first 5 rows of file
   */
  getFilePreview(fileId: number | string): Observable<any> {
    const params = {
      params: new HttpParams().set('page', '1').set('page_size', '5')
    };
    return <Observable<any>>(
      this.httpClient.get(
        `${this.API_URL}/resources/${fileId}/contents/`,
        params
      )
    );
  }

  /**
   * Download a file
   *
   */
  downloadFile(id: number | string): Observable<any> {
    return this.httpClient.get(
      `${this.API_URL}/resources/download/${id}/`,
      {
        responseType: 'blob',
        observe: 'response'
      }
    );
  }

    /**
   * Get a download url from the server
   *
   */
     fetchDownloadUrl(id: number | string): Observable<any> {
      return this.httpClient.get(
        `${this.API_URL}/resources/download-url/${id}/`
      );
    }
}
