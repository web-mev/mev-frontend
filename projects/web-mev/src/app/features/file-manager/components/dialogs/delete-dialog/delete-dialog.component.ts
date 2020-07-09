import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Component, Inject } from '@angular/core';
import { FileService} from '@file-manager/services/file-manager.service';
import { File } from '@app/shared/models/file';


@Component({
  selector: 'mev-delete-dialog',
  templateUrl: './delete-dialog.component.html',
  styleUrls: ['./delete-dialog.component.scss']
})
export class DeleteDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DeleteDialogComponent>,
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
