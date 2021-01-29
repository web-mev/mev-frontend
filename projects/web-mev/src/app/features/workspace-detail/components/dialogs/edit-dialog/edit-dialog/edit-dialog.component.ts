import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Inject
} from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FileService } from '@app/features/file-manager/services/file-manager.service';
import { FileType } from '@app/shared/models/file-type';

@Component({
  selector: 'mev-edit-dialog',
  templateUrl: './edit-dialog.component.html',
  styleUrls: ['./edit-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditDialogComponent implements OnInit {
  resourceTypes = {};

  formControl = new FormControl('', [Validators.required]);

  constructor(
    public dialogRef: MatDialogRef<EditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public fileService: FileService
  ) {}

  ngOnInit() {
    this.loadResourceTypes();
  }

  getErrorMessage() {
    return this.formControl.hasError('required') ? 'Required field' : '';
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
}
