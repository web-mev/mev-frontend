import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Component, Inject } from '@angular/core';
import { FileService } from '@file-manager/services/file-manager.service';
import { File } from '@app/shared/models/file';

/**
 * Delete File Dialog Component
 *
 * Modal dialog component which is used to delete a file from the file list
 */
@Component({
  selector: 'mev-delete-file-dialog',
  templateUrl: './delete-file-dialog.component.html',
  styleUrls: ['./delete-file-dialog.component.scss']
})
export class DeleteFileDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DeleteFileDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: File,
    public fileService: FileService
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
  confirmDelete(): void {
    this.fileService.deleteFile(this.data.id);
  }
}
