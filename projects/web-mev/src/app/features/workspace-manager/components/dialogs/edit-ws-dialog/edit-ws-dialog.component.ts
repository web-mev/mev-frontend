import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Component, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { WorkspaceService } from '@workspace-manager/services/workspace.service';
@Component({
  selector: 'mev-edit-ws-dialog',
  templateUrl: './edit-ws-dialog.component.html',
  styleUrls: ['./edit-ws-dialog.component.scss']
})
export class EditWSDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<EditWSDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public workspaceService: WorkspaceService
  ) {}

  formControl = new FormControl('', [
    Validators.required
    // Validators.email,
  ]);

  getErrorMessage() {
    return this.formControl.hasError('required')
      ? 'Required field'
      : this.formControl.hasError('email')
      ? 'Not a valid email'
      : '';
  }

  submit() {
    // empty stuff
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  stopEdit(): void {
    this.workspaceService.updateWorkspace(this.data);
  }
}
