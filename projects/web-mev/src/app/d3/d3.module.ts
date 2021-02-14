import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScatterPlotComponent } from './components/scatter-plot/scatter-plot.component';
import { SharedModule } from '@app/shared/shared.module';
import { AddSampleSetComponent } from './components/dialogs/add-sample-set/add-sample-set.component';
import { Deseq2Component } from './components/deseq2/deseq2.component';
import { LimmaComponent } from './components/limma/limma.component';
import { HclComponent } from './components/hcl/hcl.component';
import { DownloadButtonComponent } from './components/download-button/download-button.component';
import { GseaComponent } from './components/gsea/gsea/gsea.component';
import { RugPlotComponent } from './components/rug-plot/rug-plot/rug-plot.component';
import { KmeansComponent } from './components/kmeans/kmeans/kmeans.component';
import { BoxPlottingComponent } from './components/box-plotting/box-plotting.component';

@NgModule({
  declarations: [
    ScatterPlotComponent,
    AddSampleSetComponent,
    Deseq2Component,
    LimmaComponent,
    HclComponent,
    DownloadButtonComponent,
    GseaComponent,
    RugPlotComponent,
    KmeansComponent,
    BoxPlottingComponent
  ],
  imports: [CommonModule, SharedModule],
  exports: [
    ScatterPlotComponent,
    Deseq2Component,
    LimmaComponent,
    HclComponent,
    GseaComponent,
    RugPlotComponent,
    KmeansComponent,
    BoxPlottingComponent
  ]
})
export class D3Module {}
