import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import {
  WorkspaceResource,
  test_workspaceResources
} from '@features/workspace-detail/models/workspace-resource';
import { Workspace } from '@workspace-manager/models/workspace';
import { Observable } from 'rxjs';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { WorkspaceDetailService } from '@features/workspace-detail/services/workspace-detail.service';
import { AddDialogComponent } from '../dialogs/add-dialog/add-dialog.component';
@Component({
  selector: 'mev-workspace-detail',
  templateUrl: './workspace-detail.component.html',
  styleUrls: ['./workspace-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkspaceDetailComponent implements OnInit {
  workspaceResources: Array<WorkspaceResource> = test_workspaceResources;
  workspace$: Observable<Workspace>;
  searchText;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: WorkspaceDetailService,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  public loadData() {
    console.log(this.workspaceResources);

    this.workspace$ = this.route.paramMap.pipe(
      switchMap((params: ParamMap) => {
        return this.service.getWorkspaceDetail(params.get('workspaceId'));
      })
    );

    // let subscription = this.workspace$.subscribe(item=>{
    //   console.log(item);
    // })
  }

  refresh() {
    this.loadData();
  }

  selectResource(resource) {
    console.log(`The selected workspace is::  ${resource.name}`);
  }

  addItem() {
    const dialogRef = this.dialog.open(AddDialogComponent);

    dialogRef.afterClosed().subscribe(result => {
      if (result === 1) {
        // After dialog is closed we're doing frontend updates
        // For add we're just pushing a new row inside WorkspaceService
        // this.exampleDatabase.dataChange.value.push(
        //   this.workspaceService.getDialogData()
        // );
        this.refresh();
      }
    });
  }
}
