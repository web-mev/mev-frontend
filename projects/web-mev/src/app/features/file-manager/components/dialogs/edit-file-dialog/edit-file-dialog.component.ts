import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Component, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { FileService } from '@file-manager/services/file-manager.service';
import { FileType } from '@app/shared/models/file-type';

@Component({
  selector: 'mev-edit-file-dialog',
  templateUrl: './edit-file-dialog.component.html',
  styleUrls: ['./edit-file-dialog.component.scss']
})
export class EditFileDialogComponent {
  public resourceTypes = FileType;
  public resourceTypeKeys = Object.keys(FileType);

  constructor(
    public dialogRef: MatDialogRef<EditFileDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public fileService: FileService
  ) {}

  formControl = new FormControl('', [
    Validators.required
    // Validators.email,
  ]);

  getErrorMessage() {
    return this.formControl.hasError('required')
      ? 'Required field'
      : this.formControl.hasError('email')
      ? 'Not a valid email'
      : '';
  }

  submit() {
    // empty stuff
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  stopEdit(): void {
    this.fileService.updateFile(this.data);
  }
}
