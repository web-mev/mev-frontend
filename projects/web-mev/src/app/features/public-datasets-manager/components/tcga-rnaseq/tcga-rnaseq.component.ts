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
    tcga_type_count_dict = {};
    tissue_list = [];
    tissue_count_dict = {};
    selectedNames = [];
    isWaiting = false;
    totalSelectedSamples = 0;
    viewMode = 'byType';

    constructor(
        private cdRef: ChangeDetectorRef,
        public pdService: PublicDatasetService,
        private readonly notificationService: NotificationService
      ) {}

    ngOnInit(): void {

        // this object ties together multiple requests so that all the data can be combined 
        // at once. The prepare the TCGA display we need two sources of info-
        // 1. the faceted results detailing how many samples are available in each cancer type
        // 2. the human-readable names so that it's clear what "TCGA-LUAD" means.
        // The first comes from a solr query. The second comes from the database. To prepare
        // the interface, we need both
        let $observable_dict = {};
        let facet_list = [];
        let tcga_types_url = this.datasetTag + '/?q=*:*&facet=on&facet.field=project_id&rows=0'
        $observable_dict['solr_query'] = this.pdService.makeSolrQuery(tcga_types_url);
        $observable_dict['db_query'] = this.pdService.getPublicDatasetDetails(this.datasetTag);
        forkJoin($observable_dict).subscribe(
            results => {
                let name_mapping = results['db_query']['additional_metadata']['tcga_type_to_name_map'];
                
                this.tcga_types_list = [];
                this.tcga_type_count_dict = {}

                // solr returns a list with the facets interleaved with the 
                // counts in a single list. Below, extract that out to a mapping
                // of tcga type to the count of how many samples are in that type
                facet_list = results['solr_query']['facet_counts']['facet_fields']['project_id'];
                let n = Math.floor(facet_list.length / 2);
                for (let i=0; i < n; i++){
                    let tcga_id = facet_list[2*i];
                    let group_count = facet_list[2*i + 1]
                    this.tcga_type_count_dict[tcga_id] = group_count;
                    this.tcga_types_list.push({
                        name: tcga_id,
                        count: group_count,
                        readable_name: name_mapping[tcga_id]
                    })
                }
                this.cdRef.markForCheck();
            }
        );

        let tissue_types_url = this.datasetTag + '?q=*:*&facet=on&facet.field=tissue_or_organ_of_origin&rows=0'
        this.pdService.makeSolrQuery(tissue_types_url).subscribe(
            data => {
                let facet_list = [];
                this.tissue_list = [];
                this.tissue_count_dict = {};
                // solr returns a list with the facets interleaved with the 
                // counts in a single list
                facet_list = data['facet_counts']['facet_fields']['tissue_or_organ_of_origin'];
                let n = Math.floor(facet_list.length / 2);
                for (let i=0; i < n; i++){
                    this.tissue_count_dict[facet_list[2*i]] = facet_list[2*i+1];
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
            this.totalSelectedSamples += this.getCount(name);
        } else {
            let index = this.selectedNames.indexOf(name);
            if (index > -1) {
                this.selectedNames.splice(index, 1);
                this.totalSelectedSamples -= this.getCount(name);
            }
        }
    }

    // Called when the user toggles between types so that we don't
    // combine selections based on both tcga types and tissue types.
    onTypeToggle(viewMode: string){
        this.viewMode = viewMode;
        this.clearSelections();
    }

    /**
     * Used to get the number of samples in a "grouping"
     * of samples (e.g. how many samples are in TCGA-LUAD?)
     * 
     * Since we can select by TCGA ID or by tissue type
     * we keep all the logic here
     */
    getCount(grouping_key:string): number {
        if(this.viewMode === 'byType'){
            return this.tcga_type_count_dict[grouping_key];
        } else if(this.viewMode === 'byTissue'){
            return this.tissue_count_dict[grouping_key];
        } else {
            return 0;
        }
    }

    clearSelections(): void {
        this.selectedNames = [];
        this.totalSelectedSamples = 0;
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
                let count = this.tcga_type_count_dict[tcga_id];
                url_suffix = this.datasetTag + `?q=project_id:${tcga_id}&rows=${count}&fl=id`;
                $observable_dict[tcga_id] = this.pdService.makeSolrQuery(url_suffix);
            }
        } else if(dataType === 'byTissue'){
            for(let i in this.selectedNames){
                let tissue_name = this.selectedNames[i];
                let count = this.tissue_count_dict[tissue_name];
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