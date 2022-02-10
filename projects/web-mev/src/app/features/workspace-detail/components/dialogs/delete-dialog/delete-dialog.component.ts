import { Component, ChangeDetectionStrategy, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { WorkspaceDetailService } from '@app/features/workspace-detail/services/workspace-detail.service';
import { WorkspaceResource } from '@app/features/workspace-detail/models/workspace-resource';
import { NotificationService } from '@app/core/core.module';
/**
 * Delete Workspace Resource Dialog Component
 *
 * Modal dialog component which is used to delete a resource from the current workspace
 */
@Component({
  selector: 'mev-delete-dialog',
  templateUrl: './delete-dialog.component.html',
  styleUrls: ['./delete-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeleteDialogComponent {
  resource: WorkspaceResource;

  constructor(
    public dialogRef: MatDialogRef<DeleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public service: WorkspaceDetailService,
    private notificationService: NotificationService
  ) {
    this.resource = this.data.resource;
  }

  /**
   * Function is triggered when user clicks the Cancel button
   *
   */
  onNoClick(): void {
    this.dialogRef.close();
  }

  /**
   * Function is triggered when user clicks the Delete button
   *
   */
  confirmDelete(): void {
    this.service
      .deleteResourceFromWorkspace(this.data.resource.id, this.data.workspaceId)
      .subscribe(
        () => {
          this.dialogRef.close();
        },
        error => {
          let msg = error.error.message;
          if (msg){
            this.notificationService.warn(msg);
          } else {
            this.notificationService.warn('Failed to remove this file from your workspace.');
          }
        }
      );
  }
}
