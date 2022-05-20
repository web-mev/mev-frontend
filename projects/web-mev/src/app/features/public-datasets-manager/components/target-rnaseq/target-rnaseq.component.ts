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
import {PublicDatasetsComponent} from '../public-datasets-container/public-datasets.component';
import { PublicDatasetExportNameDialogComponent } from '../export-name-dialog/export-name-dialog.component';


@Component({
  selector: 'target-rnaseq-explorer',
  templateUrl: './target-rnaseq.component.html',
  styleUrls: ['./target-rnaseq.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TargetRnaseqComponent extends GdcRnaseqComponent implements OnChanges, OnInit {
  @Input() query: string = "placeholder for nowx"
  datasetTag = 'target-rnaseq';
  name_map_key = 'target_type_to_name_map';
  tissue_types_url = '';
  types_url ='';

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
    this.fetchDataTarget(this.datasetTag, this.name_map_key);
  }

  ngOnInit(): void {}
  

  createDataset(dataType: string) {
    this._createDatasetTarget(dataType, this.datasetTag);
  }

  fetchDataTarget(datasetTag: string, name_map_key: string): void {
    // this object ties together multiple requests so that all the data can be combined 
    // at once. The prepare the TCGA display we need two sources of info-
    // 1. the faceted results detailing how many samples are available in each cancer type
    // 2. the human-readable names so that it's clear what "TCGA-LUAD" means.
    // The first comes from a solr query. The second comes from the database. To prepare
    // the interface, we need both
    let $observable_dict = {};
    let facet_list = [];

    let originalTypeQueryURL = 'target-rnaseq/?q=*:*&facet=on&facet.field=project_id&rows=0';
    this.types_url = (this.query.length === 0) ? originalTypeQueryURL : `${this.datasetTag}/?q=${this.query}&facet=on&facet.field=project_id`;
    console.log("query url: ", this.types_url)
    
    $observable_dict['solr_query'] = this.pdService.makeSolrQuery(this.types_url);
    $observable_dict['db_query'] = this.pdService.getPublicDatasetDetails(datasetTag);
    forkJoin($observable_dict).subscribe(
      results => {
        let name_mapping = results['db_query']['additional_metadata'][name_map_key];

        this.types_list = [];
        this.type_count_dict = {}

        // solr returns a list with the facets interleaved with the 
        // counts in a single list. Below, extract that out to a mapping
        // of tcga type to the count of how many samples are in that type
        facet_list = results['solr_query']['facet_counts']['facet_fields']['project_id'];
        let n = Math.floor(facet_list.length / 2);
        for (let i = 0; i < n; i++) {
          let type_id = facet_list[2 * i];
          let group_count = facet_list[2 * i + 1]
          this.type_count_dict[type_id] = group_count;
          this.types_list.push({
            name: type_id,
            count: group_count,
            readable_name: name_mapping[type_id]
          })
        }
        this.cdRef.markForCheck();
      }
    );
    
    let originalTissueQueryURL = 'target-rnaseq/?q=*:*&facet=on&facet.field=tissue_or_organ_of_origin&rows=0';
    this.tissue_types_url = (this.query.length === 0) ? originalTissueQueryURL : `${this.datasetTag}/?q=${this.query}&facet=on&facet.field=tissue_or_organ_of_origin`;

    this.pdService.makeSolrQuery(this.tissue_types_url).subscribe(
      data => {
        let facet_list = [];
        this.tissue_list = [];
        this.tissue_count_dict = {};
        // solr returns a list with the facets interleaved with the 
        // counts in a single list
        facet_list = data['facet_counts']['facet_fields']['tissue_or_organ_of_origin'];
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

  _createDatasetTarget(dataType: string, datasetTag: string){
    console.log("from createdataset: ", dataType, datasetTag, this.selectedNames, this.query)
    let $observable_dict = {};

    const dialogRef = this.dialog.open(PublicDatasetExportNameDialogComponent, {disableClose: true});
  
    // we add the observable returned by `afterClosed` so that we can simultaneously query the backend
    // for sample IDs corresponding to the users selection(s) PLUS get any custom name they provide
    // for this data export. By putting all these observables into an object, we can then use the forkJoin
    // method below to ensure everything is prepared to send the final request which will create the new file(s)
    $observable_dict['output_name'] = dialogRef.afterClosed();
    this.cdRef.markForCheck();
    let url_suffix = '';
    // will have type (TCGA, TARGET, etc. identifier) (or tissue) addressing an Observable
    if(dataType === 'byType'){
        for(let i in this.selectedNames){
            let type_id = this.selectedNames[i];
            let count = this.type_count_dict[type_id];
            url_suffix = datasetTag + `?q=project_id:"${type_id}"  AND ${this.query}&rows=${count}&fl=id`;
            console.log("url suffix: ", url_suffix)
            $observable_dict[type_id] = this.pdService.makeSolrQuery(url_suffix);
        }
    } else if(dataType === 'byTissue'){
        for(let i in this.selectedNames){
            let tissue_name = this.selectedNames[i];
            let count = this.tissue_count_dict[tissue_name];
            // since the data is organized (on the backend) into a structured HDFS
            // using the "cancer type" as the key, we need to also find out which 
            // "project" each of these tissues corresponds to. We get that by adding
            // to the fl=... param
            url_suffix = datasetTag + `?q=tissue_or_organ_of_origin:"${tissue_name}" AND ${this.query}&rows=${count}&fl=id,project_id`;
            console.log("url suffix: ", url_suffix)
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
            if (datasetName === null ){
                return;
            }
            let filter_payload = {};
            let doc_list = [];
            Object.keys(results).forEach(key => {
                doc_list = results[key]['response']['docs'];
                if(dataType === 'byType'){
                    filter_payload[key] = doc_list.map(doc => doc['id']);
                } else {
                    // queried by tissue. To make a proper request to the endpoint, 
                    // we need to map the samples to their "types" (e.g. TCGA cancer type)
                    // rather than map the sample IDs via their tissue.
                    for(let doc_idx in doc_list){
                        let doc = doc_list[doc_idx];
                        let id = doc['id'];
                        let project_id = doc['project_id'];
                        if (filter_payload.hasOwnProperty(project_id) ){
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
            this.pdService.createDataset(datasetTag,final_payload).subscribe(
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