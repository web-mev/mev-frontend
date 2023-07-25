import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PublicDatasetsManagerRoutingModule } from './public-datasets-manager-routing.module';
import { PublicDatasetsListComponent } from './components/public-datasets-list/public-datasets-list.component';
import { PublicDatasetCardComponent } from './components/public-dataset-card/public-dataset-card.component';
import { TcgaRnaseqComponent } from './components/tcga-rnaseq/tcga-rnaseq.component';
import { TargetRnaseqComponent } from './components/target-rnaseq/target-rnaseq.component';
import { GtexRnaseqComponent } from './components/gtex-rnaseq/gtex-rnaseq.component';
import { GtexComponent } from './components/gtex/gtex.component'
import { TcgaMicroRnaseqComponent } from './components/tcga-micrornaseq/tcga-micrornaseq.component';
import { TcgaMethylationComponent } from './components/tcga-methylation/tcga-methylation.component'

import { SharedModule } from '@app/shared/shared.module';
import { PublicDatasetsComponent } from './components/public-datasets-container/public-datasets.component'
import { PublicDatasetExportNameDialogComponent } from './components/export-name-dialog/export-name-dialog.component';
import { CheckBoxComponent } from './components/public-datasets-container/checkbox/checkbox.component';
import { SliderPDSComponent } from './components/public-datasets-container/slider/slider.component';
import { HistogramComponent } from './components/public-datasets-container/histogram/histogram.component'


@NgModule({
  declarations: [
    PublicDatasetsComponent,
    PublicDatasetsListComponent,
    PublicDatasetCardComponent,
    TcgaRnaseqComponent,
    TcgaMicroRnaseqComponent,
    TargetRnaseqComponent,
    TcgaMethylationComponent,
    GtexRnaseqComponent,
    GtexComponent,
    PublicDatasetExportNameDialogComponent,
    CheckBoxComponent,
    SliderPDSComponent,
    HistogramComponent
  ],
  exports: [
    PublicDatasetsComponent
  ],
  imports: [CommonModule, PublicDatasetsManagerRoutingModule, SharedModule]
})
export class PublicDatasetsManagerModule { }
