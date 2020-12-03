import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval, timer, forkJoin } from 'rxjs';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { map, switchMap, takeUntil } from 'rxjs/operators';
import { File, FileAdapter } from '@app/shared/models/file';
import { environment } from '@environments/environment';
import { FileType } from '@app/shared/models/file-type';
import { AnalysesService } from '@app/features/analysis/services/analysis.service';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private readonly API_URL = environment.apiUrl;
  private readonly FILE_VALIDATION_PROGRESS_STATUSES = [
    'Validating...',
    'Processing...'
  ];
  dataChange: BehaviorSubject<File[]> = new BehaviorSubject<File[]>([]);

  public fileUploadsProgress: BehaviorSubject<
    Map<string, object>
  > = new BehaviorSubject<Map<string, object>>(new Map<string, object>());

  // Temporarily stores data from dialogs
  dialogData: any;

  constructor(
    private httpClient: HttpClient,
    private adapter: FileAdapter,
    private analysesService: AnalysesService
  ) {}

  get data(): File[] {
    return this.dataChange.getValue();
  }

  getDialogData() {
    return this.dialogData;
  }

  // GET FILE RESOURCE LIST
  getFileTypes(): Observable<FileType[]> {
    return this.httpClient.get<FileType[]>(`${this.API_URL}/resource-types/`);
  }

  // GET FILE LIST
  public getAllFiles(): any {
    this.httpClient
      .get<File[]>(`${this.API_URL}/resources/`)
      .pipe(map((data: File[]) => data.map(item => this.adapter.adapt(item))))
      .subscribe(data => {
        this.dataChange.next(data);
      });

    // refresh the status of the resource validation process
    const progress = interval(2000)
      .pipe(
        switchMap(() =>
          this.httpClient.get<File[]>(`${this.API_URL}/resources/`)
        ), // mergeMap
        map((data: File[]) => data.map(item => this.adapter.adapt(item))),
        takeUntil(timer(5000))
      )
      .subscribe(data => {
        this.dataChange.next(data);
        if (
          data.every(
            file =>
              !this.FILE_VALIDATION_PROGRESS_STATUSES.includes(file.status)
          )
        ) {
          progress.unsubscribe();
        }
      });
  }

  // ADD FILE, POST METHOD
  addFile(files: any[]): void {
    // execute the uploads sequentially, because uploading multiple files could potentially tie-up
    // the server since a bunch of threads would be busy ingesting the data for a long time

    const fileUploadsProgressMap = new Map<string, object>();

    for (let i = 0; i < files.length; i++) {
      fileUploadsProgressMap[files[i].name] = { percent: 0, isUploaded: false };
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
              fileUploadsProgressMap[files[i].name] = {
                percent: percentDone,
                isUploaded: false
              };
              this.fileUploadsProgress.next(fileUploadsProgressMap);
              break;
            case HttpEventType.Response:
              fileUploadsProgressMap[files[i].name] = {
                percent: 100,
                isUploaded: true
              };
              this.fileUploadsProgress.next(fileUploadsProgressMap);
              this.dialogData = formData;
          }
        });
    }
  }

  // ADD, POST METHOD for DROPBOX
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

  // UPDATE FILE, PUT METHOD
  updateFile(file: File): void {
    this.httpClient
      .put(`${this.API_URL}/resources/${file.id}/`, file)
      .subscribe(data => {
        this.dialogData = file;
      });
  }

  // DELETE FILE
  deleteFile(id: number | string): void {
    this.httpClient.delete(`${this.API_URL}/resources/${id}/`).subscribe();
  }
}
