import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScatterPlotComponent } from './components/scatter-plot/scatter-plot.component';
import { SharedModule } from '@app/shared/shared.module';
import { AddSampleSetComponent } from './components/dialogs/add-sample-set/add-sample-set.component';
import { Deseq2Component } from './components/deseq2/deseq2.component';
import { HclComponent } from './components/hcl/hcl.component';
import { DownloadButtonComponent } from './components/download-button/download-button.component';

@NgModule({
  declarations: [
    ScatterPlotComponent,
    AddSampleSetComponent,
    Deseq2Component,
    HclComponent,
    DownloadButtonComponent
  ],
  imports: [CommonModule, SharedModule],
  exports: [ScatterPlotComponent, Deseq2Component, HclComponent]
})
export class D3Module {}
