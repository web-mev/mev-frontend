import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {Component, ElementRef, Inject, ViewChild} from '@angular/core';
import { FileService } from "@file-manager/services/file-manager.service";
import { FormControl, Validators } from '@angular/forms';
import { File } from "@file-manager/models/file";
import {FileType} from "@file-manager/models/file-type";

@Component({
  selector: 'mev-add-dialog',
  templateUrl: './add-dialog.component.html',
  styleUrls: ['./add-dialog.component.scss']
})
export class AddDialogComponent {

  private formData: FormData = new FormData();
  public resourceTypes = Object.keys(FileType);
  @ViewChild('fileUpload', { static: false }) fileUpload: ElementRef;
  public file_name: string = ''
  public fileSelected: boolean;

  constructor(
    public dialogRef: MatDialogRef<AddDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public fileService: FileService
  ) { }

  formControl = new FormControl('', [
    Validators.required
    // Validators.email,
  ]);


  getErrorMessage() {
    return this.formControl.hasError('required')
      ? 'Required field'
      : '';
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
    let files = event.target.files;
    if (!files) {
      return
    }
    this.fileSelected = files.length>0;

    // clean previous selection if exists
    if (this.formData.has("upload_file")) {
      this.formData.delete("upload_file");
    }

    if (files.length) {
      this.file_name = files[0].name;
      this.formData.append("upload_file", files[0], files[0].name);
    }

  }

  public confirmAdd(): void {
    this.formData.append("resource_type", this.data.resource_type);
    this.fileService.addFile(this.formData);
  }



}
