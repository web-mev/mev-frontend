import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ViewChild
} from '@angular/core';
import { WorkspaceResource } from '@features/workspace-detail/models/workspace-resource';
import { Workspace, WorkspaceAdapter } from '@workspace-manager/models/workspace';
import { Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { WorkspaceDetailService } from '@features/workspace-detail/services/workspace-detail.service';
import { AddDialogComponent } from '../dialogs/add-dialog/add-dialog.component';
import { PreviewDialogComponent } from '../dialogs/preview-dialog/preview-dialog.component';
import { DeleteDialogComponent } from '../dialogs/delete-dialog/delete-dialog.component';
import { EditDialogComponent } from '../dialogs/edit-dialog/edit-dialog/edit-dialog.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { NotificationService } from '@core/notifications/notification.service';

/**
 * Workspace Detail Component
 *
 * Used to display the list of files/resources included in the current workspace
 * Also contains child components for Metadata, Analyses Flow, Tools and Analyses Result
 */
@Component({
  selector: 'mev-workspace-detail',
  templateUrl: './workspace-detail.component.html',
  styleUrls: ['./workspace-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class WorkspaceDetailComponent implements OnInit {
  workspaceResources: WorkspaceResource[];
  workspaceId: string;
  workspace: Workspace;
  searchText;
  selectedTabIndex;
  execOperationId: string;
  isWait = false;

  workspaceResourcesDS;
  displayedColumns: string[] = [
    'name',
    'readable_resource_type',
    'size',
    'created',
    'actions'
  ];
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: false }) sort: MatSort;

  constructor(
    private route: ActivatedRoute,
    private service: WorkspaceDetailService,
    public dialog: MatDialog,
    private notificationService: NotificationService,
    private workspaceAdapter: WorkspaceAdapter,
    private router: Router
  ) {}

  ngOnInit(): void {
    // populate some dummy workspace data. Otherwise it complains that 
    // this.workspace is undefined. The real data (if the workspace is found)
    // will then repopulate in loadData
    let data = {
      id: null,
      workspace_name: 'N/A',
      created: 'N/A',
      url: null,
      owner_email: 'N/A'
    }
    this.workspace = this.workspaceAdapter.adapt(data);
    this.loadData();
  }

  public loadData() {
    this.workspaceId = this.route.snapshot.paramMap.get('workspaceId');
    this.service.getConnectedResources(this.workspaceId).subscribe(
      data => {
        this.workspaceResources = data;

        this.workspaceResourcesDS = new MatTableDataSource(data);
        this.workspaceResourcesDS.paginator = this.paginator;
        this.workspaceResourcesDS.sort = this.sort;
      },
      error => {
        if(error.status === 404){
          this.notificationService.warn(`There was no workspace (${this.workspaceId}) found.`);
          this.router.navigate(["workarea"])
        }
      }
    
    );
    this.service.getWorkspaceDetail(this.workspaceId).subscribe(
      data => {
        this.workspace = this.workspaceAdapter.adapt(data);
      },
      error => {
        console.log('Workspace not found.');
      }
    );
  }

  refresh() {
    this.loadData();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.workspaceResourcesDS.filter = filterValue.trim().toLowerCase();
  }

  selectResource(resource) {
    console.log(`The selected resource is::  ${resource.name}`);
  }

  /**
   * Open a modal dialog to add files to a specific workspace
   *
   */
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

  /**
   * Open a modal dialog to preview workspace resource content
   *
   */
  previewItem(resourceId) {
    this.isWait = true;
    this.service.getResourcePreview(resourceId).subscribe(data => {
      const previewData = {};
      if (data?.results?.length && 'rowname' in data.results[0]) {
        const minN = Math.min(data.results.length, 10);
        let slicedData = data.results.slice(0, minN);
        const columns = Object.keys(slicedData[0].values);
        const rows = slicedData.map(elem => elem.rowname);
        const values = slicedData.map(elem => {
          let rowValues = [];
          const elemValues = elem.values;
          columns.forEach(col => rowValues.push(elemValues[col]));
          return rowValues;
        });
        previewData['columns'] = columns;
        previewData['rows'] = rows;
        previewData['values'] = values;
      }
      setTimeout(() => {
        this.isWait = false;
        this.dialog.open(PreviewDialogComponent, {
          data: {
            previewData: previewData
          }
        });
      }, 1000); // time-out for spinner
    });
  }

  /**
   * Open a modal dialog to edit workspace resource
   * Users can re-name resources
   */
  editItem(resource) {
    const dialogRef = this.dialog.open(EditDialogComponent, {
      data: {
        id: resource.id,
        name: resource.name,
        resource_type: resource.resource_type
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      this.refresh();
    });
  }

  /**
   * Open a modal dialog to delete a workspace resource from the current workspace
   *
   */
  deleteItem(resource) {
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      data: { workspaceId: this.workspaceId, resource: resource }
    });

    dialogRef.afterClosed().subscribe(result => {
      this.refresh();
    });
  }

  /**
   * Switch to Analyses tab when the user clicks the Run button  on the Tools tab
   *
   */
  goToAnalysesTab() {
    this.selectedTabIndex = 6;
  }

  /**
   * Refresh data when user switching between tabs
   *
   */
  onTabChanged($event) {
    const clickedIndex = $event.index;
    if (clickedIndex === 0) {
      this.refresh();
    }
  }

  /**
   * Method is triggered when the user clicks on a executed operation on the Analyses Flow Tab
   *
   */
  public showExecutedOperationResult(executedOperationId: string) {
    this.execOperationId = executedOperationId;
    this.goToAnalysesTab();
  }
}
