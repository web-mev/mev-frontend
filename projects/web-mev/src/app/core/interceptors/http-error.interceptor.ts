import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NotificationService } from '@core/notifications/notification.service';

/**
 * Passes HttpErrorResponse to application-wide error handler
 * */
@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  constructor(private readonly notificationService: NotificationService) { }

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = '';
        if (typeof error === 'string') {
          return throwError(error);
        }
        // If Unauthorized (401) and it is not user sign-in, we perform refresh process to get refresh token and don't show notification error for the user
        if (
          error instanceof HttpErrorResponse &&
          error.status === 401 &&
          request.url.indexOf('api/token') === -1
        ) {
          return next.handle(request);
        }
        if (
          error instanceof HttpErrorResponse &&
          error.status === 413) {
          errorMessage = 'The file you are attempting to upload is too large for our basic upload process. Please use an alternate method suitable for large files.';
          this.notificationService.error(errorMessage);
          return throwError(() => errorMessage);
        }
        if (
          error instanceof HttpErrorResponse &&
          error.status === 502) {
          errorMessage = 'The server is experiencing intermittent issues and is not responding. Please try again later.';
          this.notificationService.error(errorMessage);
          return throwError(() => errorMessage);
        }
        if (error.error instanceof ErrorEvent) {
          errorMessage = `Error: ${error.error.message}`;
        } else {
          let detail = 'See console for detail';
          if (error.error) {
            detail = '';
            Object.keys(error.error).forEach(error_field => {
              detail += error.error[error_field] + ' \n';
            });
          }
          errorMessage = `Error: ${detail}`; // Message: ${error.message}
        }
        // Enabling this line below will print the error to the console directly.
        // HOWEVER, that can lead to some poorly formatted messages since the
        // structure of the error responses can vary depending on the endpoint.  
        //this.notificationService.error(errorMessage);
        if (error.status === 500) {
          return throwError(() => errorMessage);
        } else {
          // If the next.handle(request) is uncommented, then 
          // calling functions cannot act on any 400 or 404 error codes
          // By instead throwing the error, we can act on it and issue
          // an appropriate messageß
          //return next.handle(request);
          return throwError(() => error);
        }
      })
    );
  }
}
