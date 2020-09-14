import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AnalysesComponent } from './components/analysis-list/analyses.component';
import { ExecutedOperationComponent } from './components/executed-operation/executed-operation.component';

const routes: Routes = [
  {
    path: 'executedOperation/:executedOperationId',
    component: ExecutedOperationComponent
  },
  {
    path: '',
    component: AnalysesComponent,
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AnalysisRoutingModule {}
