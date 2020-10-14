import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { WorkspaceResource } from '@features/workspace-detail/models/workspace-resource';
import { Workspace } from '@workspace-manager/models/workspace';
import { Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { WorkspaceDetailService } from '@features/workspace-detail/services/workspace-detail.service';
import { AddDialogComponent } from '../dialogs/add-dialog/add-dialog.component';
import { PreviewDialogComponent } from '../dialogs/preview-dialog/preview-dialog.component';
@Component({
  selector: 'mev-workspace-detail',
  templateUrl: './workspace-detail.component.html',
  styleUrls: ['./workspace-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class WorkspaceDetailComponent implements OnInit {
  workspaceResources: WorkspaceResource[];
  workspaceId: string;
  workspace$: Observable<Workspace>;
  searchText;
  selectedTabIndex;
  execOperationId: string;
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private service: WorkspaceDetailService,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  public loadData() {
    this.workspaceId = this.route.snapshot.paramMap.get('workspaceId');
    this.service.getConnectedResources(this.workspaceId).subscribe(data => {
      this.workspaceResources = data;
    });
    this.workspace$ = this.service.getWorkspaceDetail(this.workspaceId);
  }

  refresh() {
    this.loadData();
  }

  selectResource(resource) {
    console.log(`The selected resource is::  ${resource.name}`);
  }

  addItem() {
    const dialogRef = this.dialog.open(AddDialogComponent, {
      data: { workspaceId: this.workspaceId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 1) {
        this.refresh();
      }
    });
  }

  previewItem(resourceId) {
    this.service.getResourcePreview(resourceId).subscribe(data => {
      const previewData = data;
      const dialogRef = this.dialog.open(PreviewDialogComponent, {
        data: {
          previewData: previewData
        }
      });
    });
  }

  metadata(resourceId) {
    this.router.navigate([resourceId, 'metadata'], { relativeTo: this.route });
  }

  goToAnalysesTab() {
    this.selectedTabIndex = 3;
  }

  public showExecutedOperationResult(executedOperationId: any) {
    this.execOperationId = executedOperationId;
    this.goToAnalysesTab();
  }
}
