import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Component, Inject } from '@angular/core';
import { FileService } from '@file-manager/services/file-manager.service';
import { File } from '@app/shared/models/file';

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

  onNoClick(): void {
    this.dialogRef.close();
  }

  confirmDelete(): void {
    this.fileService.deleteFile(this.data.id);
  }
}
