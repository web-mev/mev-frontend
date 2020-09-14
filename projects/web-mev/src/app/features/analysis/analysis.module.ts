import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalysisRoutingModule } from './analysis-routing.module';
import { SharedModule } from '@app/shared/shared.module';
import { AngularMultiSelectModule } from 'angular2-multiselect-dropdown';
import { OperationComponent } from './components/operation/operation.component';
import { ExecutedOperationComponent } from './components/executed-operation/executed-operation.component';
import { AnalysesComponent } from './components/analysis-list/analyses.component';

@NgModule({
  declarations: [
    AnalysesComponent,
    OperationComponent,
    ExecutedOperationComponent
  ],
  exports: [OperationComponent],
  imports: [
    CommonModule,
    SharedModule,
    AngularMultiSelectModule,
    AnalysisRoutingModule
  ]
})
export class AnalysisModule {}
