import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { FileService } from '@file-manager/services/file-manager.service';
import { FormControl, Validators } from '@angular/forms';
import { FileType } from '@app/shared/models/file-type';

@Component({
  selector: 'mev-add-file-dialog',
  templateUrl: './add-file-dialog.component.html',
  styleUrls: ['./add-file-dialog.component.scss']
})
export class AddFileDialogComponent {
  private formData: FormData = new FormData();
  private filesToUpload: any[] = [];
  public resourceTypes = Object.keys(FileType);
  @ViewChild('fileUpload', { static: false }) fileUpload: ElementRef;
  public fileNames: string[];
  public isLargeFile: boolean;
  public fileSelected: boolean;

  constructor(
    public dialogRef: MatDialogRef<AddFileDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public fileService: FileService
  ) {}

  formControl = new FormControl('', [
    Validators.required
    // Validators.email,
  ]);

  getErrorMessage() {
    return this.formControl.hasError('required') ? 'Required field' : '';
  }

  submit() {
    // empty stuff
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onUploadBtnClick() {
    const fileUpload = this.fileUpload.nativeElement;
    fileUpload.click();
  }

  setFile(event) {
    const fileSizeTreshold = 524288000;

    this.filesToUpload = event.target.files;
    if (!this.filesToUpload) {
      return;
    }
    this.fileSelected = this.filesToUpload.length > 0;

    // clean previous selection if exists
    this.fileNames = [];
    this.isLargeFile = false;

    for (let i = 0; i < this.filesToUpload.length; i++) {
      if (this.filesToUpload[i].size >= fileSizeTreshold) {
        this.isLargeFile = true;
      }
      this.fileNames.push(this.filesToUpload[i].name);
    }
  }

  public confirmAdd(): void {
    this.formData.append('resource_type', this.data.resource_type);
    this.fileService.addFile(this.formData, this.filesToUpload);
  }
}
