import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PublicDatasetsManagerRoutingModule } from './public-datasets-manager-routing.module';
import { PublicDatasetsListComponent } from './components/public-datasets-list/public-datasets-list.component';
import { PublicDatasetCardComponent } from './components/public-dataset-card/public-dataset-card.component';
import { GtexComponent } from './components/gtex/gtex.component';
import { PublicDatasetExplorerComponent } from './components/public-dataset-explorer/public-dataset-explorer.component';
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
    GtexComponent,
    PublicDatasetExportNameDialogComponent,
    CheckBoxComponent,
    SliderPDSComponent,
    HistogramComponent,
    PublicDatasetExplorerComponent
  ],
  exports: [
    PublicDatasetsComponent
  ],
  imports: [CommonModule, PublicDatasetsManagerRoutingModule, SharedModule]
})
export class PublicDatasetsManagerModule { }
