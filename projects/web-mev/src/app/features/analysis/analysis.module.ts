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
import { AnalysisFlowComponent } from './components/analysis-flow/analysis-flow.component';
import { AnalysisPlottingResultComponent } from './components/analysis-plotting-result/analysis-plotting-result.component';
import { PlottingMenuComponent } from './components/plotting-menu/plotting-menu.component';
import { IGVComponent } from './components/igv/igv.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AddDialog2Component } from './components/igv/add-dialog/add-dialog.component';


@NgModule({
  declarations: [
    AnalysesComponent,
    OperationComponent,
    ExecutedOperationComponent,
    AnalysisResultComponent,
    AnalysisFlowComponent,
    AnalysisPlottingResultComponent,
    PlottingMenuComponent,
    IGVComponent,
    AddDialog2Component
  ],
  exports: [
    OperationComponent,
    AnalysesComponent,
    ExecutedOperationComponent,
    AnalysisFlowComponent,
    PlottingMenuComponent,
    IGVComponent,
    AddDialog2Component
  ],
  imports: [
    CommonModule,
    SharedModule,
    AngularMultiSelectModule,
    D3Module,
    AnalysisRoutingModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class AnalysisModule { }
