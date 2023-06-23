import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ROUTE_ANIMATIONS_ELEMENTS } from '../../../core/core.module';
import { environment } from '@environments/environment';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';

/**
 * About component
 * Used for the start WebMEV page
 */
@Component({
  selector: 'mev-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AboutComponent implements OnInit {
  routeAnimationsElements = ROUTE_ANIMATIONS_ELEMENTS;
  private readonly API_URL = environment.apiUrl;
  showResult = true;

  constructor(
    private httpClient: HttpClient,
    private _snackBar: MatSnackBar
  ) { }

  ngOnInit() {
    this.getNotificationData();
  }

  getNotificationData() {
    let queryURL = `${this.API_URL}/latest-message/`;
    this.httpClient.get(queryURL).pipe(
      catchError(error => {
        let message = `Error: ${error.error.error}`;
        throw message
      }))
      .subscribe(data => {
        if (Object.keys(data).length !== 0) {
          let message = data['message'];
          this._snackBar.open(message, 'X', {
            duration: 15000,
            panelClass: 'warning-notification-overlay'
          });
        }
      });
  }
}
