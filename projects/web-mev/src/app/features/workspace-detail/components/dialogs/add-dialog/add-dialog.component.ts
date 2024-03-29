import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Inject
} from '@angular/core';
import { Validators, FormControl } from '@angular/forms';
import { WorkspaceDetailService } from '@app/features/workspace-detail/services/workspace-detail.service';

/**
 * Add Workspace Resource Dialog Component
 *
 * Modal dialog component which is used to add new resources to the current workspace
 */
@Component({
  selector: 'mev-add-dialog',
  templateUrl: './add-dialog.component.html',
  styleUrls: ['./add-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddDialogComponent implements OnInit {
  files = [];
  selectedFiles = [];

  dropdownSettings = {};
  workspaceId: string;

  constructor(
    public dialogRef: MatDialogRef<AddDialogComponent>,
    private apiService: WorkspaceDetailService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  formControl = new FormControl('', [Validators.required]);

  ngOnInit(): void {
    this.workspaceId = this.data.workspaceId;
    this.apiService.getAvailableResources().subscribe(data => {
      let final_files = [];
      // Below, we filter out files that are already in this workspace so
      // the size of the displayed list is shorter
      for( let f of data ) {
        let workspace_ids_for_resource = f.workspaces.map(w => w['id']);
        if(!workspace_ids_for_resource.includes(this.workspaceId)){
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
      classes: 'resource-dropdown',
      tagToBody: false
    };
  }

  /**
   * Function is triggered when user clicks the Cancel button
   *
   */
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
    this.selectedFiles.forEach(file => {
      this.apiService
        .addResourceToWorkspace(file.id, this.data.workspaceId)
        .subscribe();
    });
  }
}
