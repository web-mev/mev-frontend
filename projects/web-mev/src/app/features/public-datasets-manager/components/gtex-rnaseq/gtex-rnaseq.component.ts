// import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
// import { FileService } from '@app/features/file-manager/services/file-manager.service';
// import { NotificationService } from '@core/notifications/notification.service';
// import { PublicDatasetService } from '../../services/public-datasets.service';
// import { GtexComponent } from '../gtex/gtex.component';
// import { MatDialog } from '@angular/material/dialog';

// @Component({
//   selector: 'gtex-rnaseq-explorer',
//   templateUrl: './gtex-rnaseq.component.html',
//   styleUrls: ['./gtex-rnaseq.component.scss'],
//   changeDetection: ChangeDetectionStrategy.OnPush
// })
// export class GtexRnaseqComponent extends GtexComponent implements OnInit {
//   datasetTag = 'gtex-rnaseq';
//   name_map_key = 'gtex_type_to_name_map'

//   constructor(
//     public cdRef: ChangeDetectorRef,
//     public pdService: PublicDatasetService,
//     public notificationService: NotificationService,
//     public fileService: FileService,
//     public dialog: MatDialog
//   ) {
//     super(cdRef, pdService, notificationService, fileService, dialog);
//   }

//   ngOnInit(): void {
//     this.fetchData(this.datasetTag, this.name_map_key);
//   }

//   createDataset(dataType: string) {
//     this._createDataset(dataType, this.datasetTag);
//   }
// }

import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Input,
  OnChanges
} from '@angular/core';
import { FileService } from '@app/features/file-manager/services/file-manager.service';
import { NotificationService } from '@core/notifications/notification.service';
import { PublicDatasetService } from '../../services/public-datasets.service';
import { GdcRnaseqComponent } from '../gdc_base/gdc-base.component';
import { MatDialog } from '@angular/material/dialog';
import { forkJoin } from 'rxjs';
import { PublicDatasetsComponent } from '../public-datasets-container/public-datasets.component';
import { PublicDatasetExportNameDialogComponent } from '../export-name-dialog/export-name-dialog.component';


@Component({
  selector: 'gtex-rnaseq-explorer',
  templateUrl: './gtex-rnaseq.component.html',
  styleUrls: ['./gtex-rnaseq.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GtexRnaseqComponent extends GdcRnaseqComponent implements OnChanges, OnInit {
  @Input() query: string = "placeholder for nowx"
  datasetTag = 'gtex-rnaseq';
  name_map_key = 'gtex_type_to_name_map';
  tissue_types_url = '';
  types_url = '';

  constructor(
    public cdRef: ChangeDetectorRef,
    public pdService: PublicDatasetService,
    public notificationService: NotificationService,
    public fileService: FileService,
    public dialog: MatDialog,
    public publicDataSetComponent: PublicDatasetsComponent
  ) {
    super(cdRef, pdService, notificationService, fileService, dialog);
  }

  ngOnChanges(): void {
    this.fetchDataGtex(this.datasetTag, this.name_map_key);
    
  }

  ngOnInit(): void { }


  createDataset(dataType: string) {
    this._createDatasetGtex(dataType, this.datasetTag);
  }

  fetchDataGtex(datasetTag: string, name_map_key: string): void {
    this.viewMode = "byTissue";
    let $observable_dict = {};
    let originalTissueQueryURL = 'gtex-rnaseq/?q=*:*&facet=on&facet.field=tissue&rows=0&facet.age_range.sort';
    this.tissue_types_url = (this.query.length === 0) ? originalTissueQueryURL : `${this.datasetTag}/?q=${this.query}&facet=on&facet.field=tissue&facet.age_range.sort`;
    $observable_dict['solr_query'] = this.pdService.makeSolrQuery(originalTissueQueryURL);
    $observable_dict['db_query'] = this.pdService.getPublicDatasetDetails(datasetTag);
    this.pdService.makeSolrQuery(this.tissue_types_url).subscribe(
      data => {
        let facet_list = [];
        this.tissue_list = [];
        this.tissue_count_dict = {};
        // solr returns a list with the facets interleaved with the 
        // counts in a single list
        facet_list = data['facet_counts']['facet_fields']['tissue'];
        let n = Math.floor(facet_list.length / 2);
        for (let i = 0; i < n; i++) {
          this.tissue_count_dict[facet_list[2 * i]] = facet_list[2 * i + 1];
          this.tissue_list.push({
            name: facet_list[2 * i],
            count: facet_list[2 * i + 1]
          })
        }
        this.cdRef.markForCheck();
      }
    );
  }

  _createDatasetGtex(dataType: string, datasetTag: string) {
    let $observable_dict = {};

    const dialogRef = this.dialog.open(PublicDatasetExportNameDialogComponent, { disableClose: true });

    // we add the observable returned by `afterClosed` so that we can simultaneously query the backend
    // for sample IDs corresponding to the users selection(s) PLUS get any custom name they provide
    // for this data export. By putting all these observables into an object, we can then use the forkJoin
    // method below to ensure everything is prepared to send the final request which will create the new file(s)
    $observable_dict['output_name'] = dialogRef.afterClosed();
    this.cdRef.markForCheck();
    let url_suffix = '';
    // will have type (TCGA, TARGET, etc. identifier) (or tissue) addressing an Observable
    if (dataType === 'byTissue') {
      for (let i in this.selectedNames) {
        let tissue_name = this.selectedNames[i];
        let count = this.tissue_count_dict[tissue_name];
        // since the data is organized (on the backend) into a structured HDFS
        // using the "cancer type" as the key, we need to also find out which 
        // "project" each of these tissues corresponds to. We get that by adding
        // to the fl=... param

        url_suffix = datasetTag + `?q=tissue:"${tissue_name}" AND ${this.query}&rows=${count}&fl=sample_id`
        $observable_dict[tissue_name] = this.pdService.makeSolrQuery(url_suffix);
      }
    }
    // forkJoin forces all the observables to complete and then takes
    // their results. If we don't do this, the subsequent request to
    // create the dataset can be 'waiting' for the list of sample IDs
    // and hence the request for dataset creation will be incomplete/invalid.
    forkJoin($observable_dict).subscribe(
      results => {
        let datasetName = results['output_name'];
        delete results['output_name'];

        // a value of `null` here is a signal that the user aborted
        // creation of the dataset via the modal (the one which asks
        // them to provide a custom name for the data export). Hence, we 
        // bail if a null is encountered
        if (datasetName === null) {
          return;
        }
        let filter_payload = {};
        let doc_list = [];
        Object.keys(results).forEach(key => {
          doc_list = results[key]['response']['docs'];
          if (dataType === 'byType') {
            filter_payload[key] = doc_list.map(doc => doc['id']);
          } else {
            // queried by tissue. To make a proper request to the endpoint, 
            // we need to map the samples to their "types" (e.g. TCGA cancer type)
            // rather than map the sample IDs via their tissue.

            for (let doc_idx in doc_list) {
              let doc = doc_list[doc_idx];
              let id = doc['sample_id'];
              let project_id = key.toString();
              if (filter_payload.hasOwnProperty(project_id)) {
                filter_payload[project_id].push(id);
              } else {
                filter_payload[project_id] = [id];
              }
            }
          }
        });
        let final_payload = {
          'filters': filter_payload,
          'output_name': datasetName
        };
        this.isWaiting = true;
        this.cdRef.markForCheck();
        this.pdService.createDataset(datasetTag, final_payload).subscribe(
          results => {
            this.isWaiting = false;
            this.cdRef.markForCheck();
            this.fileService.getAllFilesPolled();
            this.notificationService.success('Your files are being prepared.' +
              ' You can check the status of these in the file browser.'
            );
          }
        );
      }
    );
  }
}
