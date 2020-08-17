import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalysisRoutingModule } from './analysis-routing.module';
import { Deseq2Component } from './components/deseq2/deseq2.component';
import { SharedModule } from '@app/shared/shared.module';
import { AngularMultiSelectModule } from 'angular2-multiselect-dropdown';

@NgModule({
  declarations: [Deseq2Component],
  exports: [Deseq2Component],
  imports: [
    CommonModule,
    AnalysisRoutingModule,
    SharedModule,
    AngularMultiSelectModule
  ]
})
export class AnalysisModule {}
