import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalysisRoutingModule } from './analysis-routing.module';
import { SharedModule } from '@app/shared/shared.module';
import { AngularMultiSelectModule } from 'angular2-multiselect-dropdown';
import { OperationComponent } from './components/operation/operation.component';
import { ExecutedOperationComponent } from './components/executed-operation/executed-operation.component';
import { AnalysesComponent } from './components/analysis-list/analyses.component';
import { AnalysisResultComponent } from './components/analysis-result/analysis-result.component';
import { D3Module } from '@app/d3/d3.module';
import { NgxCsvParserModule } from 'ngx-csv-parser';
import { AnalysisFlowComponent } from './components/analysis-flow/analysis-flow.component';

@NgModule({
  declarations: [
    AnalysesComponent,
    OperationComponent,
    ExecutedOperationComponent,
    AnalysisResultComponent,
    AnalysisFlowComponent
  ],
  exports: [
    OperationComponent,
    AnalysesComponent,
    ExecutedOperationComponent,
    AnalysisFlowComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    AngularMultiSelectModule,
    D3Module,
    NgxCsvParserModule,
    AnalysisRoutingModule
  ]
})
export class AnalysisModule {}
