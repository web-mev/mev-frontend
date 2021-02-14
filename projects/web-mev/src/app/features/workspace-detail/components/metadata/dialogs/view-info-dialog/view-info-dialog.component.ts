import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

/**
 * Feature/Observation Information Dialog Component
 *
 * Modal dialog component which is used to view information
 * about custom observation and feature sets
 */
@Component({
  selector: 'mev-view-info-dialog',
  templateUrl: './view-info-dialog.component.html',
  styleUrls: ['./view-info-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewInfoDialogComponent implements OnInit {
  constructor(public dialogRef: MatDialogRef<ViewInfoDialogComponent>) {}

  ngOnInit(): void {}

  /**
   * Function is triggered when user clicks the Close button
   *
   */
  onNoClick(): void {
    this.dialogRef.close();
  }
}
