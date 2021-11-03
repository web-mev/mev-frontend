import {
    Component,
    OnInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef
  } from '@angular/core';
import { NotificationService } from '@core/notifications/notification.service';
import { forkJoin } from 'rxjs';
import { PublicDatasetService } from '../../services/public-datasets.service';

  @Component({
    selector: 'tcga-rnaseq-explorer',
    templateUrl: './tcga-rnaseq.component.html',
    styleUrls: ['./tcga-rnaseq.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
  })
  export class TcgaRnaseqComponent implements OnInit {

    datasetTag = 'tcga-rnaseq'
    tcga_types_list = [];
    tcga_type_dict = {};
    tissue_list = [];
    tissue_dict = {};
    selectedNames = [];
    isWaiting = false;

    constructor(
        private cdRef: ChangeDetectorRef,
        public pdService: PublicDatasetService,
        private readonly notificationService: NotificationService
      ) {}

    ngOnInit(): void {

        // get the faceted view of the TCGA cancer types (and how
        // many samples are in each)
        let tcga_types_url = this.datasetTag + '/?q=*:*&facet=on&facet.field=project_id&rows=0'
        this.pdService.makeSolrQuery(tcga_types_url).subscribe(
            data => {
                this.tcga_types_list = [];
                this.tcga_type_dict = {}

                // solr returns a list with the facets interleaved with the 
                // counts in a single list
                let facet_list = data['facet_counts']['facet_fields']['project_id'];
                let n = Math.floor(facet_list.length / 2);
                for (let i=0; i < n; i++){
                    this.tcga_type_dict[facet_list[2*i]] = facet_list[2*i + 1];
                    this.tcga_types_list.push({
                        name: facet_list[2*i],
                        count: facet_list[2*i + 1]
                    })
                }
                this.cdRef.markForCheck();
            }
        );

        let tissue_types_url = this.datasetTag + '?q=*:*&facet=on&facet.field=tissue_or_organ_of_origin&rows=0'
        this.pdService.makeSolrQuery(tissue_types_url).subscribe(
            data => {
                this.tissue_list = [];
                this.tissue_dict = {};
                // solr returns a list with the facets interleaved with the 
                // counts in a single list
                let facet_list = data['facet_counts']['facet_fields']['tissue_or_organ_of_origin'];
                let n = Math.floor(facet_list.length / 2);
                for (let i=0; i < n; i++){
                    this.tissue_dict[facet_list[2*i]] = facet_list[2*i+1];
                    this.tissue_list.push({
                        name: facet_list[2*i],
                        count: facet_list[2*i + 1]
                    })
                }
                this.cdRef.markForCheck();
            }
        );

    }

    checkboxSelection(event, name: string) {
        if(event['checked']){
            this.selectedNames.push(name);
        } else {
            let index = this.selectedNames.indexOf(name);
            if (index > -1) {
                this.selectedNames.splice(index, 1);
            }
        }
    }

    // Called when the user toggles between types so that we don't
    // combine selections based on both tcga types and tissue types.
    onTypeToggle(){
        this.selectedNames = [];
    }

    /**
     * Used to query the samples in the selected types
     * and initiate the creation of the count matrix 
     * + annotation file
     */
    createDataset(dataType: string){
        this.isWaiting = true;
        this.cdRef.markForCheck();
        let url_suffix = '';
        // will have TCGA type (or tissue) addressing an Observable
        let $observable_dict = {};
        if(dataType === 'byType'){
            for(let i in this.selectedNames){
                let tcga_id = this.selectedNames[i];
                let count = this.tcga_type_dict[tcga_id];
                url_suffix = this.datasetTag + `?q=project_id:${tcga_id}&rows=${count}&fl=id`;
                $observable_dict[tcga_id] = this.pdService.makeSolrQuery(url_suffix);
            }
        } else if(dataType === 'byTissue'){
            for(let i in this.selectedNames){
                let tissue_name = this.selectedNames[i];
                let count = this.tissue_dict[tissue_name];
                url_suffix = this.datasetTag + `?q=tissue_or_organ_of_origin:${tissue_name}&rows=${count}&fl=id`;
                $observable_dict[tissue_name] = this.pdService.makeSolrQuery(url_suffix);
            }
        }
        // forkJoin forces all the observables to complete and then takes
        // their results. If we don't do this, the subsequent request to
        // create the dataset can be 'waiting' for the list of sample IDs
        // and hence the request for dataset creation will be incomplete/invalid.
        forkJoin($observable_dict).subscribe(
            results => {
                let filter_payload = {};
                let doc_list = [];
                Object.keys(results).forEach(key => {
                    doc_list = results[key]['response']['docs'];
                    filter_payload[key] = doc_list.map(doc => doc['id']);
                });
                let final_payload = {
                    'filters': filter_payload
                };
                this.pdService.createDataset('tcga-rnaseq',final_payload).subscribe(
                    results => {
                        console.log(results);
                        this.isWaiting = false;
                        this.cdRef.markForCheck();
                        this.notificationService.success('Your files are now available.' +
                            ' Note that you may need to refresh the file listing.'
                        );
                    }
                );  
            }    
        );
    }
  }