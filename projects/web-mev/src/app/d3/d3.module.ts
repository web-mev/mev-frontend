import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScatterPlotComponent } from './components/scatter-plot/scatter-plot.component';
import { SharedModule } from '@app/shared/shared.module';
import { AddSampleSetComponent } from './components/dialogs/add-sample-set/add-sample-set.component';
import { ClusterLabelerComponent } from './components/dialogs/cluster-labeler/cluster-labeler.component';
import { Deseq2Component } from './components/deseq2/deseq2.component';
import { LimmaComponent } from './components/limma/limma.component';
import { HclComponent } from './components/hcl/hcl.component';
import { DownloadButtonComponent } from './components/download-button/download-button.component';
import { GseaComponent } from './components/gsea/gsea/gsea.component';
import { RugPlotComponent } from './components/rug-plot/rug-plot/rug-plot.component';
import { KmeansComponent } from './components/kmeans/kmeans/kmeans.component';
import { D3BoxPlotComponent } from './components/box-plotting/box-plotting.component';
import { DifferentialExpressionComponent } from './components/differential_expression/differential_expression.component';
import { EdgerComponent } from './components/edger/edger.component';
import { MastDgeComponent } from './components/sctk-mast/sctk-mast.component';
import { RnaSeqNormalizationComponent } from './components/rnaseq-normalization/rnaseq-normalization.component';
import { BoxplotFormComponent } from './components/boxplot/boxplot.component';
import { HeatmapFormComponent } from './components/heatmap/heatmap.component';
import { MevBaseExpressionPlotFormComponent } from './components/base-expression-plot-form/base-expression-plot-form.component';
import { D3HeatmapPlotComponent } from './components/heatmap-plotter/heatmap-plotter.component';
import { UmapScatterPlotComponent } from './components/sctk-umap/umap-scatter-plot.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { SctkSeuratClusterComponent } from './components/sctk-seurat-cluster/sctk-seurat-cluster.component';
import { SctkDoubletDetectionComponent } from './components/sctk-doublet-detection/sctk-doublet-detection.component';
import { SctkCxdsDoubletDetectionComponent } from './components/sctk-cxds-doublet-detection/sctk-cxds-doublet-detection.component';
import { SctkCellDoubletDetectionComponent } from '@app/d3/components/sctk-cell-doublet-detection/sctk-cell-doublet-detection.component';

@NgModule({
  declarations: [
    ScatterPlotComponent,
    AddSampleSetComponent,
    ClusterLabelerComponent,
    Deseq2Component,
    LimmaComponent,
    HclComponent,
    DownloadButtonComponent,
    GseaComponent,
    RugPlotComponent,
    KmeansComponent,
    D3BoxPlotComponent,
    DifferentialExpressionComponent,
    EdgerComponent,
    MastDgeComponent,
    RnaSeqNormalizationComponent,
    BoxplotFormComponent,
    HeatmapFormComponent,
    MevBaseExpressionPlotFormComponent,
    D3HeatmapPlotComponent,
    UmapScatterPlotComponent,
    SctkSeuratClusterComponent,
    SctkDoubletDetectionComponent,
    SctkCxdsDoubletDetectionComponent,
    SctkCellDoubletDetectionComponent
  ],
  imports: [CommonModule, SharedModule, DragDropModule],
  exports: [
    ScatterPlotComponent,
    Deseq2Component,
    LimmaComponent,
    HclComponent,
    GseaComponent,
    RugPlotComponent,
    KmeansComponent,
    D3BoxPlotComponent,
    EdgerComponent,
    MastDgeComponent,
    RnaSeqNormalizationComponent,
    BoxplotFormComponent,
    HeatmapFormComponent,
    UmapScatterPlotComponent,
    SctkSeuratClusterComponent,
    SctkDoubletDetectionComponent,
    SctkCxdsDoubletDetectionComponent,
    SctkCellDoubletDetectionComponent
  ]
})
export class D3Module {}
