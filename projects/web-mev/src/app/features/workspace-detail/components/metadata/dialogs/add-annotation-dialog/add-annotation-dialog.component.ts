import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Inject
} from '@angular/core';
import { WorkspaceDetailService } from '@app/features/workspace-detail/services/workspace-detail.service';

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
    private apiService: WorkspaceDetailService,
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
    console.log('this.selectedFiles ', this.selectedFiles);
    this.selectedFiles.forEach(file => {
      this.apiService.getMetadata(file.id).subscribe(metadata => {
        this.dialogRef.close(metadata);
      });
    });
  }
}
