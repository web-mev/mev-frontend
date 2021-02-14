import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Inject
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

/**
 * Preview Workspace Resource Dialog Component
 *
 * Modal dialog component which is used to preview resource content
 */
@Component({
  selector: 'mev-preview-dialog',
  templateUrl: './preview-dialog.component.html',
  styleUrls: ['./preview-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreviewDialogComponent implements OnInit {
  previewData: any;

  constructor(
    public dialogRef: MatDialogRef<PreviewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.previewData = this.data.previewData;
  }

  /**
   * Function is triggered when user clicks the Cancel button
   *
   */
  onNoClick(): void {
    this.dialogRef.close();
  }

  submit() {
    // empty stuff
  }
}
