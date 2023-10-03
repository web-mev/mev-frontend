import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PCAComponent } from './components/pca/pca.component';
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
import { CombatseqComponent } from './components/combatseq/combatseq.component';
import { WgcnaComponent } from './components/wgcna/wgcna.component';
import { WgcnaTableComponent } from './components/wgcna/wgcna_table.component';
import { WGCNAQcPlotComponent } from './components/wgcna/wgcna_qc_plot.component';
import { WgcnaElbowDialogComponent } from './components/wgcna/wgcna_elbow_example.component';
import { TopgoComponent } from './components/topgo/topgo.component';
import { MatrixSubsetComponent } from './components/matrix_subset/matrix_subset.component';
import { TopGoBubblePlotComponent } from './components/topgo/bubble-plot/bubble-plot.component';
import { PandaComponent } from './components/panda/panda.component';
import { MatBadgeModule } from '@angular/material/badge';
import { GeneMappingComponent } from './components/gene-mapping/geneMapping.component';
import { SubnetVisualizationFormComponent } from './components/subnet-visualization/subnet-visualization.component';
import { DecontxComponent } from './components/decontx-decontamination/decontx.component';
import { CellRangerComponent } from './components/sctk-10x-cell-ranger/cell_ranger.component';
import { LionComponent } from './components/lioness/lioness.component';
import { DownloadPNGButtonComponent } from './components/download-png-button/download-png-button.component';
import { VolcanoComponent } from './components/volcano/volcano.component';
import { LikelihoodRatioTestComponent } from './components/likelihood-ratio-test/likelihood-ratio-test.component';
import { LikelihoodBoxPlotComponent } from './components/likelihood-ratio-test/likelihood-boxplot/box-plot.component'
import { WigConversionComponent } from './components/wig-conversion/wigConversion.component';
import { SNFComponent } from './components/snf/snf.component';
import { PumaComponent } from './components/puma/puma.component';
import { DragonComponent } from './components/dragon/dragon.component';
import { AxisLabelDialogComponent } from './components/dragon/axisLabelDialog/axisLabelDialog.component';
import { SctkSingleRComponent } from './components/sctk-singleR/sctk-singleR.component';
import { ResultInputInfoComponent} from './components/result-input-info/result-input-info.component';
import { InputInfoDialogComponent } from './components/result-input-info/inputInfoDialog/input-info-dialog.component';

@NgModule({
  declarations: [
    PCAComponent,
    AddSampleSetComponent,
    ClusterLabelerComponent,
    Deseq2Component,
    LimmaComponent,
    HclComponent,
    DownloadButtonComponent,
    DownloadPNGButtonComponent,
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
    SctkCellDoubletDetectionComponent,
    CombatseqComponent,
    WgcnaComponent,
    WgcnaTableComponent,
    WGCNAQcPlotComponent,
    WgcnaElbowDialogComponent,
    TopgoComponent,
    MatrixSubsetComponent,
    TopGoBubblePlotComponent,
    PandaComponent,
    GeneMappingComponent,
    SubnetVisualizationFormComponent,
    DecontxComponent,
    CellRangerComponent,
    LionComponent,
    VolcanoComponent,
    LikelihoodRatioTestComponent,
    LikelihoodBoxPlotComponent,
    WigConversionComponent,
    SNFComponent,
    PumaComponent,
    DragonComponent,
    AxisLabelDialogComponent,
    SctkSingleRComponent,
    ResultInputInfoComponent,
    InputInfoDialogComponent
  ],
  imports: [CommonModule, SharedModule, DragDropModule, MatBadgeModule],
  exports: [
    PCAComponent,
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
    SctkCellDoubletDetectionComponent,
    CombatseqComponent,
    WgcnaComponent,
    TopgoComponent,
    MatrixSubsetComponent,
    TopGoBubblePlotComponent,
    PandaComponent,
    GeneMappingComponent,
    SubnetVisualizationFormComponent,
    DecontxComponent,
    CellRangerComponent,
    LionComponent,
    VolcanoComponent,
    LikelihoodRatioTestComponent,
    LikelihoodBoxPlotComponent,
    WigConversionComponent,
    SNFComponent,
    PumaComponent,
    DragonComponent,
    AxisLabelDialogComponent,
    SctkSingleRComponent,
    ResultInputInfoComponent,
    InputInfoDialogComponent
  ]
})
export class D3Module { }
