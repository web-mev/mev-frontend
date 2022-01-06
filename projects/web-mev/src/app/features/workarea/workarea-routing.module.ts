import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { WorkareaComponent } from './components/workarea.component';

const routes: Routes = [
  // {
  //   path: ':resourceId/metadata',
  //   component: MetadataComponent
  // },
  // {
  //   path: 'analyses',
  //   component: AnalysesComponent
  // },

  // {
  //   path: 'executedOperation/:executedOperationId',
  //   component: ExecutedOperationComponent
  // },
  {
    path: '',
    component: WorkareaComponent,
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
export class WorkareaRoutingModule {}
