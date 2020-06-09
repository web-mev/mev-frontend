import { Injectable, OnInit } from '@angular/core';
import { BehaviorSubject, throwError } from 'rxjs';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders
} from '@angular/common/http';
import { retry, catchError } from 'rxjs/operators';
import { NotificationService } from '@core/core.module';
import { Workspace } from '../models/workspace';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceService {
  private readonly API_URL = environment.apiUrl + '/workspaces';
  httpOptions: Object = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  dataChange: BehaviorSubject<Workspace[]> = new BehaviorSubject<Workspace[]>(
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

  get data(): Workspace[] {
    return this.dataChange.value;
  }

  getDialogData() {
    return this.dialogData;
  }

  getAllWorkspaces(): void {
    this.httpClient
      .get<Workspace[]>(this.API_URL)
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
  addWorkspace(workspace: Workspace): void {
    this.httpClient
      .post(this.API_URL, workspace, this.httpOptions)
      .pipe(retry(1), catchError(this.handleError))
      .subscribe(
        data => {
          this.dialogData = workspace;
        },
        (err: HttpErrorResponse) => {
          this.notificationService.error('Error occurred. Details: ' + err);
        }
      );
  }

  // UPDATE, PUT METHOD
  updateWorkspace(workspace: Workspace): void {
    this.httpClient
      .put(`${this.API_URL}/${workspace.id}`, workspace, this.httpOptions)
      .pipe(retry(1), catchError(this.handleError))
      .subscribe(
        data => {
          this.dialogData = workspace;
        },
        (err: HttpErrorResponse) => {
          this.notificationService.error('Error occurred. Details: ' + err);
        }
      );
  }

  // DELETE METHOD
  deleteWorkspace(id: number): void {
    this.httpClient
      .delete(`${this.API_URL}/${id}`, this.httpOptions)
      .pipe(retry(1), catchError(this.handleError))
      .subscribe(
        data => {},
        (err: HttpErrorResponse) => {
          this.notificationService.error('Error occurred. Details: ' + err);
        }
      );
  }
}
