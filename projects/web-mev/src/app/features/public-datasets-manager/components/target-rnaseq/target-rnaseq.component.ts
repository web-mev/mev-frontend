import {
    Component,
    OnInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef
  } from '@angular/core';
import { NotificationService } from '@core/notifications/notification.service';
import { PublicDatasetService } from '../../services/public-datasets.service';
import {GdcRnaseqComponent} from '../gdc_base/gdc-base.component';

  @Component({
    selector: 'target-rnaseq-explorer',
    templateUrl: './target-rnaseq.component.html',
    styleUrls: ['../gdc_base/gdc-base.component.scss','./target-rnaseq.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
  })
  export class TargetRnaseqComponent extends GdcRnaseqComponent implements OnInit{
    datasetTag = 'target-rnaseq';
    name_map_key = 'target_type_to_name_map'

    constructor(
        public cdRef: ChangeDetectorRef,
        public pdService: PublicDatasetService,
        public notificationService: NotificationService
      ) {
        super(cdRef, pdService, notificationService);
      }


    ngOnInit(): void {
        console.log('init TARGET...');
        this.fetchData(this.datasetTag, this.name_map_key);
    }

    createDataset(dataType: string) {
        this._createDataset(dataType, this.datasetTag);
    }
  }