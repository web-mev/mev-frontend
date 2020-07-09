import { Injectable, ErrorHandler } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

import { environment } from '@environments/environment';

import { NotificationService } from '@core/notifications/notification.service';

/** Application-wide error handler that adds a UI notification to the error handling
 * provided by the default Angular ErrorHandler.
 */
@Injectable()
export class AppErrorHandler extends ErrorHandler {
  constructor(private notificationsService: NotificationService) {
    super();
  }

  handleError(error) {

    let displayMessage = 'An error occurred.';

    if (!environment.production) {
      displayMessage += ' See console for details.';
    }

    super.handleError(error);
  }
}
