import {
    Component,
    OnInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef
  } from '@angular/core';
import { NotificationService } from '@core/notifications/notification.service';
import { PublicDatasetService } from '../../services/public-datasets.service';
import {GdcRnaseqComponent} from '../gdc_base/gdc-base.component';
import { MatDialog } from '@angular/material/dialog';

  @Component({
    selector: 'tcga-rnaseq-explorer',
    templateUrl: './tcga-rnaseq.component.html',
    styleUrls: ['../gdc_base/gdc-base.component.scss', './tcga-rnaseq.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
  })
  export class TcgaRnaseqComponent extends GdcRnaseqComponent implements OnInit{
    datasetTag = 'tcga-rnaseq';
    name_map_key = 'tcga_type_to_name_map'

    constructor(
        public cdRef: ChangeDetectorRef,
        public pdService: PublicDatasetService,
        public notificationService: NotificationService,
        public dialog: MatDialog

      ) {
        super(cdRef, pdService, notificationService, dialog);
      }


    ngOnInit(): void {
        this.fetchData(this.datasetTag, this.name_map_key);
    }

    createDataset(dataType: string) {
        this._createDataset(dataType, this.datasetTag);
    }
  }