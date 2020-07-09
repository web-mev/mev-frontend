import { Injectable } from '@angular/core';
import {environment} from '@environments/environment';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {NotificationService} from '@core/notifications/notification.service';
import {Workspace} from '@workspace-manager/models/workspace';
import {catchError, retry} from 'rxjs/operators';
import {Observable, throwError} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceDetailService {
  private readonly API_URL = environment.apiUrl + '/workspaces';

  constructor(
    private httpClient: HttpClient,
    private readonly notificationService: NotificationService
  ) { }

  handleError(error: HttpErrorResponse) {
    let errorMessage = 'Unknown error';
    if (error.error instanceof ErrorEvent) {
      // Client-side errors
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side errors
      errorMessage = `Server Side Error. Status: ${error.status} ${error.statusText}\nMessage: ${error.error.detail}`;
    }
    return throwError(errorMessage);
  }

  getWorkspaceDetail(id: number | string): Observable<Workspace> {
    return <Observable<Workspace>> this.httpClient
      .get( `${this.API_URL}/${id}/`)
      .pipe(retry(1), catchError(this.handleError))
      // .subscribe(
      //   data => {
      //     console.log(data);
      //     //this.dialogData = workspace;
      //   },
      //   (err) => {
      //     this.notificationService.error('Error occurred. Details: ' + err);
      //   }
      // );
  }

}
