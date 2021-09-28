import { Injectable, NgZone } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

function setDuration(duration: number|null, defaultDuration: number):number{
  var d;
  if (duration){
    d = duration;
  } else {
    d = defaultDuration;
  }
  return d;
}

/**
 * Notification service
 *
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(
    private readonly snackBar: MatSnackBar,
    private readonly zone: NgZone
  ) {}

  default(message: string, duration?: number) {
    var d = setDuration(duration, 2000);
    this.show(message, {
      duration: d,
      panelClass: 'default-notification-overlay'
    });
  }

  info(message: string, duration?: number) {
    var d = setDuration(duration, 2000);
    this.show(message, {
      duration: d,
      panelClass: 'info-notification-overlay'
    });
  }

  success(message: string, duration?: number) {
    var d = setDuration(duration, 2000);
    this.show(message, {
      duration: d,
      panelClass: 'success-notification-overlay'
    });
  }

  warn(message: string, duration?: number) {
    var d = setDuration(duration, 10000);
    this.show(message, {
      duration: d,
      panelClass: 'warning-notification-overlay'
    });
  }

  error(message: string, duration?: number) {
    var d = setDuration(duration, 10000);
    this.show(message, {
      duration: d,
      panelClass: 'error-notification-overlay'
    });
  }

  private show(message: string, configuration: MatSnackBarConfig) {
    // Need to open snackBar from Angular zone to prevent issues with its position per
    // https://stackoverflow.com/questions/50101912/snackbar-position-wrong-when-use-errorhandler-in-angular-5-and-material
    this.zone.run(() => this.snackBar.open(message, null, configuration));
  }
}
