import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, timer, forkJoin } from 'rxjs';
import { HttpClient, HttpEventType } from '@angular/common/http';
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
  public getAllFiles(): void {
    // refresh the status of the resource validation process every 2 seconds
    const maxTimer$ = timer(this.maxTime);
    timer(0, 2000)
      .pipe(
        concatMap(() => this.httpClient.get(`${this.API_URL}/resources/`)),
        map((files: File[]) => files.map(file => this.adapter.adapt(file))),
        takeWhile(
          files =>
            files.some(file =>
              this.FILE_VALIDATION_PROGRESS_STATUSES.includes(file.status)
            ),
          true
        ),
        takeUntil(maxTimer$)
      )
      .subscribe(data => {
        this.dataChange.next(data);
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
