import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

/**
 * View File Types Dialog Component
 *
 * Modal dialog component which is used to view detailed information about file types
 */
@Component({
  selector: 'mev-view-file-types-dialog',
  templateUrl: './view-file-types-dialog.component.html',
  styleUrls: ['./view-file-types-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewFileTypesDialogComponent implements OnInit {
  isTableShown = {
    numeric: false,
    integer: false,
    feature: false,
    expression: false,
    count: false,
    annotation: false
  };
  constructor(public dialogRef: MatDialogRef<ViewFileTypesDialogComponent>) {}

  ngOnInit(): void {}

  /**
   * Function is triggered when user clicks the Cancel button
   *
   */
  onNoClick(): void {
    this.dialogRef.close();
  }

  /**
   * Function is triggered when user clicks the Show/hide example button
   *
   * Controls the visibility of example tables
   */
  toggleShow(type) {
    this.isTableShown[type] = !this.isTableShown[type];
  }
}
