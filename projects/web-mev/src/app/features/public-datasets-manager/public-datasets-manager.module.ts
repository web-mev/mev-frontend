import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PublicDatasetsManagerRoutingModule } from './public-datasets-manager-routing.module';
import { PublicDatasetsListComponent } from './components/public-datasets-list/public-datasets-list.component';
import { PublicDatasetCardComponent } from './components/public-dataset-card/public-dataset-card.component';
import { TcgaRnaseqComponent } from './components/tcga-rnaseq/tcga-rnaseq.component';
import { TargetRnaseqComponent } from './components/target-rnaseq/target-rnaseq.component';
import { GtexRnaseqComponent } from './components/gtex-rnaseq/gtex-rnaseq.component';
import { SharedModule } from '@app/shared/shared.module';
import { PublicDatasetsComponent } from './components/public-datasets-container/public-datasets.component'
import { PublicDatasetExportNameDialogComponent } from './components/export-name-dialog/export-name-dialog.component';

@NgModule({
  declarations: [
    PublicDatasetsComponent,
    PublicDatasetsListComponent,
    PublicDatasetCardComponent,
    TcgaRnaseqComponent,
    TargetRnaseqComponent,
    GtexRnaseqComponent,
    PublicDatasetExportNameDialogComponent
  ],
  exports: [
    PublicDatasetsComponent
  ],
  imports: [CommonModule, PublicDatasetsManagerRoutingModule, SharedModule]
})
export class PublicDatasetsManagerModule {}
