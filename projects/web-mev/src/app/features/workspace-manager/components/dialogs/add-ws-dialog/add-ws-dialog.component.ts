import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Component, Inject } from '@angular/core';
import { WorkspaceService } from '@workspace-manager/services/workspace.service';
import { FormControl, Validators } from '@angular/forms';
import { Workspace } from '@workspace-manager/models/workspace';
import { NotificationService } from '@core/notifications/notification.service';

@Component({
  selector: 'mev-add-ws-dialog',
  templateUrl: './add-ws-dialog.component.html',
  styleUrls: ['./add-ws-dialog.component.scss']
})
export class AddWSDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<AddWSDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Workspace,
    public workspaceService: WorkspaceService,
    private readonly notificationService: NotificationService
  ) {}

  formControl = new FormControl('', [
    Validators.required
  ]);

  getErrorMessage() {
    return this.formControl.hasError('required') ? 'Required field' : '';
  }

  submit() {
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  public confirmAdd(): void {
    this.workspaceService.addWorkspace(this.data).subscribe(
      response => {
      this.data = response;
      this.dialogRef.close(1);
    },
    error => {
      // display any error response from the backend. For this endpoint,
      // the error response would be related to a bad name (e.g. one
      // that is already taken by this user).
      this.notificationService.error(error.error['workspace_name']);
    });
  }
}
