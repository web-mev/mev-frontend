import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { WorkspaceResource, test_workspaceResources } from '@features/workspace-detail/models/workspace-resource';
import { Workspace } from '@workspace-manager/models/workspace';
import { Observable } from 'rxjs';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { WorkspaceDetailService } from '@features/workspace-detail/services/workspace-detail.service';
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
    private service: WorkspaceDetailService
  ) { }

  ngOnInit(): void {
    
    console.log(this.workspaceResources)

    this.workspace$ = this.route.paramMap.pipe(
      switchMap((params: ParamMap) => {
        return this.service.getWorkspaceDetail(params.get('workspaceId'));
      })
    );

    // let subscription = this.workspace$.subscribe(item=>{
    //   console.log(item);
    // })





  }

  selectResource(resource) {
    console.log(`The selected workspace is::  ${resource.name}`);
  }

}
