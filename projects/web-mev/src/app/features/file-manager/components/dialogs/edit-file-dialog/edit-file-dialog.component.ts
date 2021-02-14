import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { FileService } from '@file-manager/services/file-manager.service';
import { FileType } from '@app/shared/models/file-type';

/**
 * Edit File Dialog Component
 *
 * Modal dialog component which is used to edit a file name or file(resource) type
 */
@Component({
  selector: 'mev-edit-file-dialog',
  templateUrl: './edit-file-dialog.component.html',
  styleUrls: ['./edit-file-dialog.component.scss']
})
export class EditFileDialogComponent implements OnInit {
  public resourceTypes = {};

  formControl = new FormControl('', [Validators.required]);

  constructor(
    public dialogRef: MatDialogRef<EditFileDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public fileService: FileService
  ) {}

  ngOnInit() {
    this.loadResourceTypes();
  }

  getErrorMessage() {
    return this.formControl.hasError('required')
      ? 'Required field'
      : this.formControl.hasError('email')
      ? 'Not a valid email'
      : '';
  }

  /**
   * Function is triggered when user clicks the Cancel button
   *
   */
  onNoClick(): void {
    this.dialogRef.close();
  }

  /**
   * Function is triggered when user clicks the Save button
   *
   */
  stopEdit(): void {
    this.fileService.updateFile(this.data);
  }

  loadResourceTypes() {
    this.fileService.getFileTypes().subscribe((fileTypes: FileType[]) => {
      fileTypes.forEach(
        type =>
          (this.resourceTypes[type.resource_type_key] = {
            title: type.resource_type_title,
            description: type.resource_type_description
          })
      );
    });
  }

  submit() {
    // empty stuff
  }
}
