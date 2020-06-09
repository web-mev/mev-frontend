import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Component, Inject } from '@angular/core';
import { WorkspaceService } from '@workspace-manager/services/workspace.service';
import { FormControl, Validators } from '@angular/forms';
import { Workspace } from '@workspace-manager/models/workspace';

@Component({
  selector: 'mev-add-dialog',
  templateUrl: './add-dialog.component.html',
  styleUrls: ['./add-dialog.component.scss']
})
export class AddDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<AddDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Workspace,
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

  public confirmAdd(): void {
    this.workspaceService.addWorkspace(this.data);
  }
}
