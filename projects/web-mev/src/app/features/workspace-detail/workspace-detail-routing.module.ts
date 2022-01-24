import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { WorkspaceDetailComponent } from './components/workspace-detail/workspace-detail.component';

const routes: Routes = [

  {
    path: '',
    component: WorkspaceDetailComponent,
    pathMatch: 'full'
    // children: [
    //   {
    //     path: 'analyses',
    //     loadChildren: () =>
    //     import('../analysis/analysis.module').then(m => m.AnalysisModule),
    //   }
    // ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WorkspaceDetailRoutingModule {}
