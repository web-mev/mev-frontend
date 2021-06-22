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
  constructor(private readonly notificationService: NotificationService) {}

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
        this.notificationService.error(errorMessage);
        if(error.status === 500){
          return throwError(errorMessage);
        } else {
          return next.handle(request);
        }
      })
    );
  }
}
