import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { FileService } from '@app/features/file-manager/services/file-manager.service';
import { NotificationService } from '@core/notifications/notification.service';
import { PublicDatasetService } from '../../services/public-datasets.service';
import { GdcRnaseqComponent } from '../gdc_base/gdc-base.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'gtex-rnaseq-explorer',
  templateUrl: './gtex-rnaseq.component.html',
  styleUrls: ['../gdc_base/gdc-base.component.scss', './gtex-rnaseq.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GtexRnaseqComponent extends GdcRnaseqComponent implements OnInit {
  datasetTag = 'gtex-rnaseq';
  name_map_key = 'gtex_type_to_name_map'

  constructor(
    public cdRef: ChangeDetectorRef,
    public pdService: PublicDatasetService,
    public notificationService: NotificationService,
    public fileService: FileService,
    public dialog: MatDialog
  ) {
    super(cdRef, pdService, notificationService, fileService, dialog);
  }


  ngOnInit(): void {
    this.fetchData(this.datasetTag, this.name_map_key);
  }

  createDataset(dataType: string) {
    console.log("viewmode.val: ", dataType)
    this._createDataset(dataType, this.datasetTag);
  }
}