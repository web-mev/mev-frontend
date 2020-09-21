import { Component, ChangeDetectionStrategy, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

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

  onNoClick(): void {
    this.dialogRef.close();
  }

  confirmDelete(): void {}
}
