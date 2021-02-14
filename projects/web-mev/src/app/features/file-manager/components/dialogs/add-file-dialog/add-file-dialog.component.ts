import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { FileService } from '@file-manager/services/file-manager.service';
import { FormControl, Validators } from '@angular/forms';
import { FileType } from '@app/shared/models/file-type';

/**
 * Add File Dialog Component
 *
 * Modal dialog component which is used to add files to the file list
 */
@Component({
  selector: 'mev-add-file-dialog',
  templateUrl: './add-file-dialog.component.html',
  styleUrls: ['./add-file-dialog.component.scss']
})
export class AddFileDialogComponent {
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

  formControl = new FormControl('', [Validators.required]);

  /**
   * Function is triggered when user clicks the Select files button.
   * Simulates clicking the hidden input element
   *
   */
  onUploadBtnClick() {
    const fileUpload = this.fileUpload.nativeElement;
    fileUpload.click();
  }

  /**
   * Function is triggered when user selects 1 or more files in the input element
   *
   * For large files a warning message is displayed
   */
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

  /**
   * Function is triggered when user clicks the Upload button
   *
   */
  public confirmAdd(): void {
    this.fileService.addFile(this.filesToUpload);
  }

  getErrorMessage() {
    return this.formControl.hasError('required') ? 'Required field' : '';
  }

  submit() {
    // empty
  }

  /**
   * Function is triggered when user clicks the Cancel button
   *
   */
  onNoClick(): void {
    this.dialogRef.close();
  }
}
