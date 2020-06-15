import { Injectable, OnInit } from '@angular/core';
import { BehaviorSubject, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { retry, catchError } from 'rxjs/operators';
import { NotificationService } from '@core/core.module';
import { File } from "@file-manager/models/file";
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private readonly API_URL = environment.apiUrl + '/resources';
  httpOptions: Object = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };


  dataChange: BehaviorSubject<File[]> = new BehaviorSubject<File[]>(
    []
  );

  // Temporarily stores data from dialogs
  dialogData: any;

  constructor(
    private httpClient: HttpClient,
    private readonly notificationService: NotificationService
  ) {}

  handleError(error: HttpErrorResponse) {
    let errorMessage = 'Unknown error';
    if (error.error instanceof ErrorEvent) {
      // Client-side errors
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side errors
      errorMessage = `Server Side Error. Code: ${error.status}\nMessage: ${error.message}`;
    }
    return throwError(errorMessage);
  }

  get data(): File[] {
    return this.dataChange.value;
  }

  getDialogData() {
    return this.dialogData;
  }

  getAllFiles(): void {
    this.httpClient
      .get<File[]>(`${this.API_URL}/`, this.httpOptions)
      .pipe(retry(1), catchError(this.handleError))
      .subscribe(
        data => {
          this.dataChange.next(data);
        },
        (err: HttpErrorResponse) => {
          this.notificationService.error('Error occurred. Details: ' + err);
        }
      );
  }

  // ADD, POST METHOD
  addFile(file: any): void {

    this.httpClient
      .post(`${this.API_URL}/upload/`, file)
      .pipe(retry(1), catchError(this.handleError))
      .subscribe(
        data => {
          this.dialogData = file;
        },
        (err: HttpErrorResponse) => {
          this.notificationService.error('Error occurred. Details: ' + err);
        }
      );
  }

  // UPDATE, PUT METHOD
  updateFile(file: File): void {
    this.httpClient
      .put(`${this.API_URL}/${file.id}/`, file, this.httpOptions)
      .pipe(retry(1), catchError(this.handleError))
      .subscribe(
        data => {
          this.dialogData = file;
        },
        (err: HttpErrorResponse) => {
          this.notificationService.error('Error occurred. Details: ' + err);
        }
      );
  }

  // DELETE METHOD
  deleteFile(id: number | string): void {
    this.httpClient
      .delete(`${this.API_URL}/${id}/`, this.httpOptions)
      .pipe(retry(1), catchError(this.handleError))
      .subscribe(
        data => {},
        (err: HttpErrorResponse) => {
          this.notificationService.error('Error occurred. Details: ' + err);
        }
      );
  }
}
