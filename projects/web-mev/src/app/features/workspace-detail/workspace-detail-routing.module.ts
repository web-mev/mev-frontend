import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MetadataComponent } from './components/metadata/metadata.component';
import { WorkspaceDetailComponent } from './components/workspace-detail/workspace-detail.component';

const routes: Routes = [
  {
    path: ':resourceId/metadata',
    component: MetadataComponent
  },
  {
    path: '',
    component: WorkspaceDetailComponent,
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WorkspaceDetailRoutingModule {}
