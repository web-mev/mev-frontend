import { Component, ChangeDetectionStrategy, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

/**
 * Delete Observation Dialog Component
 *
 * Modal dialog component which is used to delete a custom observation set
 */
@Component({
  selector: 'mev-delete-set-dialog',
  templateUrl: './delete-set-dialog.component.html',
  styleUrls: ['./delete-set-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeleteSetDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DeleteSetDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  /**
   * Function is triggered when user clicks the Cancel button
   *
   */
  onNoClick(): void {
    this.dialogRef.close();
  }

  /**
   * Function is triggered when user clicks the Delete button
   *
   */
  confirmDelete(): void {}
}
