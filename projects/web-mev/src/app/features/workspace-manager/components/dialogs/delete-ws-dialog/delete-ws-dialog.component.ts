import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Component, Inject } from '@angular/core';
import { WorkspaceService } from '@workspace-manager/services/workspace.service';

@Component({
  selector: 'mev-delete-ws-dialog',
  templateUrl: './delete-ws-dialog.component.html',
  styleUrls: ['./delete-ws-dialog.component.scss']
})
export class DeleteWSDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DeleteWSDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public workspaceService: WorkspaceService
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

  confirmDelete(): void {
    this.workspaceService.deleteWorkspace(this.data.id);
  }
}
