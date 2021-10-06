import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { FileService } from '@file-manager/services/file-manager.service';
import { FormControl, Validators } from '@angular/forms';
import { FileType } from '@app/shared/models/file-type';
import { environment } from '@environments/environment';

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
  private potentialFilesToUpload: any[] = [];
  private filesToUpload: any[] = [];
  public resourceTypes = Object.keys(FileType);
  @ViewChild('fileUpload', { static: false }) fileUpload: ElementRef;
  public fileNames: string[];
  public largeFileNames: string[];
  public isLargeFile: boolean;
  public fileSelected: boolean;
  public validSelections: boolean;
  private readonly MAX_UPLOAD_SIZE_BYTES = environment.maximumUploadSizeBytes;

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

    // the server will respond with a 413 status code if the body is too large.
    // However, that catch (in the http-error interceptor) is a fall-back option.
    // We should attempt to block right up front. Set this to a reasonably large
    // value (e.g. 512Mb)
    const fileSizeThreshold = this.MAX_UPLOAD_SIZE_BYTES;

    this.potentialFilesToUpload = event.target.files;
    if (!this.potentialFilesToUpload) {
      return;
    }
    this.fileSelected = this.potentialFilesToUpload.length > 0;

    // clean previous selection if exists
    this.filesToUpload = [];
    this.fileNames = [];
    this.largeFileNames = [];
    this.isLargeFile = false;
    this.validSelections = false;

    for (let i = 0; i < this.potentialFilesToUpload.length; i++) {
      if (this.potentialFilesToUpload[i].size >= fileSizeThreshold) {
        this.isLargeFile = true;
        this.largeFileNames.push(this.potentialFilesToUpload[i].name);
      } else {
        this.fileNames.push(this.potentialFilesToUpload[i].name);
        this.validSelections = true;
        this.filesToUpload.push(this.potentialFilesToUpload[i]);
      }
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
