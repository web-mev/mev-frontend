import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PublicDatasetsManagerRoutingModule } from './public-datasets-manager-routing.module';
import { PublicDatasetsListComponent } from './components/public-datasets-list/public-datasets-list.component';
import { PublicDatasetCardComponent } from './components/public-dataset-card/public-dataset-card.component';
import { SharedModule } from '@app/shared/shared.module';


@NgModule({
  declarations: [
    PublicDatasetsListComponent,
    PublicDatasetCardComponent,
  ],
  exports: [PublicDatasetsListComponent],
  imports: [CommonModule, PublicDatasetsManagerRoutingModule, SharedModule]
})
export class PublicDatasetsManagerModule {}
