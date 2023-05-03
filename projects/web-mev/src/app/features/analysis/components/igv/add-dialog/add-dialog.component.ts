import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Component, OnInit, ChangeDetectionStrategy, Inject, Output, EventEmitter } from '@angular/core';
import { Validators, FormControl } from '@angular/forms';
import { WorkspaceDetailService } from '@app/features/workspace-detail/services/workspace-detail.service';

@Component({
  selector: 'mev-add-dialog2',
  templateUrl: './add-dialog.component.html',
  styleUrls: ['./add-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddDialog2Component implements OnInit {
  // @Output() filesAdded = new EventEmitter<any>();
  files = [];
  selectedFiles = [];

  dropdownSettings = {};
  workspaceId: string;

  constructor(
    public dialogRef: MatDialogRef<AddDialog2Component>,
    private apiService: WorkspaceDetailService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  formControl = new FormControl('', [Validators.required]);

  ngOnInit(): void {
    this.workspaceId = this.data.workspaceId;
    this.apiService.getAvailableResources().subscribe(data => {
      console.log("data: ", data)
      let final_files = [];
      for (let f of data) {
        if (f.resource_type === 'ALN') {
          final_files.push(f)
        }

      }
      this.files = final_files;
    });

    this.dropdownSettings = {
      text: 'Select resources',
      selectAllText: 'Select All',
      unSelectAllText: 'Unselect All',
      enableSearchFilter: true,
      searchBy: ['name', 'readable_resource_type'],
      lazyLoading: true,
      classes: 'resource-dropdown'
    };
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  submit() {
    // empty stuff
  }

  /**
   * Function is triggered when user clicks the Add button
   *
   */
  confirmAdd() {
    // this.selectedFiles.forEach(file => {
    //   this.apiService
    //     .addResourceToWorkspace(file.id, this.data.workspaceId)
    //     .subscribe();
    // });
    // this.filesAdded.emit(this.selectedFiles);
    // console.log(this.filesAdded, this.selectedFiles)
    this.dialogRef.close(this.selectedFiles);
  }
}
