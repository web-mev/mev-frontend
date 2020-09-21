import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Inject
} from '@angular/core';

@Component({
  selector: 'mev-add-annotation-dialog',
  templateUrl: './add-annotation-dialog.component.html',
  styleUrls: ['./add-annotation-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddAnnotationDialogComponent implements OnInit {
  files = [];
  selectedFiles = [];

  dropdownSettings = {};
  constructor(
    public dialogRef: MatDialogRef<AddAnnotationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.dropdownSettings = {
      text: 'Select resources',
      selectAllText: 'Select All',
      unSelectAllText: 'Unselect All',
      classes: 'resource-dropdown'
    };

    this.files = this.data.workspaceResources;
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  submit() {
    // empty stuff
  }

  confirmAdd() {
    // temporarily use only 1 file to get metadata
    const selectedFile =
      this.selectedFiles.length > 0 ? this.selectedFiles[0] : null;
    this.dialogRef.close(selectedFile.id);
  }
}
