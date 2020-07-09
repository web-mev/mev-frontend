import { Injectable, Injector, ErrorHandler } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { retry, catchError, tap } from 'rxjs/operators';
import { NotificationService } from '@core/notifications/notification.service';

/** Passes HttpErrorResponse to application-wide error handler */
@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  constructor(
    private injector: Injector,
    private readonly notificationService: NotificationService
  ) { }

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      retry(1),
      catchError((error: HttpErrorResponse) => {
        let errorMessage = '';

        // If Unauthorized (401), we perform refresh process and don't show notification error for the user
        if (error instanceof HttpErrorResponse && error.status === 401) {
          return next.handle(request);
        }
        if (error.error instanceof ErrorEvent) {
          // client-side error
          errorMessage = `Error: ${error.error.message}`;
        } else {
          // server-side error
          let detail = 'See console for detail';
          if (error.error && error.error.detail) {
            detail = error.error.detail;
          } else if ('detail' in error) {
            detail = error['detail'];
          }
          errorMessage = `Server Side Error. Code: ${error.status}. Details: ${detail}
                          Message: ${error.message}`;
        }
        this.notificationService.error(errorMessage);
        return throwError(errorMessage);
      })
    );
  }
}
