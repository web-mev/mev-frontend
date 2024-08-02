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
import { DefaultOperationComponent } from './components/default-operation-inputs/default-operation-inputs.component';
import { DifferentialExpressionInputComponent } from './components/differential-expression-input/differential-expression-input.component';
import { KmeansInputComponent } from './components/kmeans-input/kmeans-input.component';
import { LikelihoodRatioTestInputComponent } from './components/likelihood-ratio-test-input/likelihood-ratio-test-input.component';
import { SCTKMastInputComponent } from './components/sctk-mast-input/sctk-mast-input.component';
import { CombatseqInputComponent } from './components/combatseq-input/combatseq-input.component';
import { SnfInputComponent } from './components/snf-input/snf-input.component';
import { StgradientInputComponent } from './components/stgradient-input/stgradient-input.component';
import { StheitInputComponent } from './components/stheit-input/stheit-input.component';
import { StnormalizationInputComponent } from './components/stnormalization-input/stnormalization-input.component';
import { SpatialgePathwayEnrichmentInputComponent } from './components/spatialge-pathway-enrichment-input/spatialge-pathway-enrichment-input.component'
import { SpatialgeClusteringInputComponent } from './components/spatialge-clustering-input/spatialge-clustering-input.component';
import { SpotlightInputComponent } from './components/spotlight-input/spotlight-input.component';

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
    AddDialog2Component,
    DefaultOperationComponent,
    DifferentialExpressionInputComponent,
    KmeansInputComponent,
    LikelihoodRatioTestInputComponent,
    SCTKMastInputComponent,
    CombatseqInputComponent,
    SnfInputComponent,
    StgradientInputComponent,
    StheitInputComponent,
    StnormalizationInputComponent,
    SpatialgePathwayEnrichmentInputComponent,
    SpatialgeClusteringInputComponent,
    SpotlightInputComponent,
  ],
  exports: [
    OperationComponent,
    AnalysesComponent,
    ExecutedOperationComponent,
    AnalysisFlowComponent,
    PlottingMenuComponent,
    IGVComponent,
    AddDialog2Component,
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
