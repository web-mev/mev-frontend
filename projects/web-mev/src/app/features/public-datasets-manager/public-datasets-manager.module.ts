import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PublicDatasetsManagerRoutingModule } from './public-datasets-manager-routing.module';
import { PublicDatasetsListComponent } from './components/public-datasets-list/public-datasets-list.component';
import { PublicDatasetCardComponent } from './components/public-dataset-card/public-dataset-card.component';
import { TcgaRnaseqComponent } from './components/tcga-rnaseq/tcga-rnaseq.component';
import { SharedModule } from '@app/shared/shared.module';
import { PublicDatasetsComponent } from './components/public-datasets-container/public-datasets.component'

@NgModule({
  declarations: [
    PublicDatasetsComponent,
    PublicDatasetsListComponent,
    PublicDatasetCardComponent,
    TcgaRnaseqComponent
  ],
  exports: [
    PublicDatasetsComponent
  ],
  imports: [CommonModule, PublicDatasetsManagerRoutingModule, SharedModule]
})
export class PublicDatasetsManagerModule {}
