import { Injectable, ErrorHandler } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

import { environment } from '../../../environments/environment';

import { NotificationService } from '../notifications/notification.service';

/** Application-wide error handler that adds a UI notification to the error handling
 * provided by the default Angular ErrorHandler.
 */
@Injectable()
export class AppErrorHandler extends ErrorHandler {
  constructor(private notificationsService: NotificationService) {
    super();
  }

  handleError(error: Error | HttpErrorResponse) {

    // If Unauthorized (401), we perform refresh process and don't show notification error for the user
    if (error instanceof HttpErrorResponse && error.status === 401) {
      return;
    }

    let displayMessage = 'An error occurred.';

    if (!environment.production) {
      displayMessage += ' See console for details.';
    }

    this.notificationsService.error(displayMessage);

    super.handleError(error);

  }
}
