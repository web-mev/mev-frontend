import { Component, ChangeDetectionStrategy, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { WorkspaceDetailService } from '@app/features/workspace-detail/services/workspace-detail.service';
import { WorkspaceResource } from '@app/features/workspace-detail/models/workspace-resource';

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
    public service: WorkspaceDetailService
  ) {
    this.resource = this.data.resource;
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  confirmDelete(): void {
    this.service
      .deleteResourceFromWorkspace(this.data.resource.id, this.data.workspaceId)
      .subscribe(
        () => {
          this.dialogRef.close();
        },
        error => {
          console.error(error);
        }
      );
  }
}
