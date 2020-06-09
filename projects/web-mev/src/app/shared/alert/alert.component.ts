import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import {
  ROUTE_ANIMATIONS_ELEMENTS,
  NotificationService
} from '@core/core.module';

@Component({
  selector: 'mev-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AlertComponent implements OnInit {
  routeAnimationsElements = ROUTE_ANIMATIONS_ELEMENTS;

  constructor(private readonly notificationService: NotificationService) {}

  ngOnInit() {}

  default() {
    this.notificationService.default('Default message');
  }

  info() {
    this.notificationService.info('Info message');
  }

  success() {
    this.notificationService.success('Success message');
  }

  warn() {
    this.notificationService.warn('Warning message');
  }

  error() {
    this.notificationService.error('Error message');
  }
}
