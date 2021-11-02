import {
    Component,
    OnInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef
  } from '@angular/core';
  
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

    constructor(
        private cdRef: ChangeDetectorRef,
        public pdService: PublicDatasetService
      ) {}

    ngOnInit(): void {
        console.log('in rnaseq init...');

        // get the faceted view of the TCGA cancer types (and how
        // many samples are in each)
        let tcga_types_url = this.datasetTag + '/?q=*:*&facet=on&facet.field=project_id&rows=0'
        this.pdService.makeSolrQuery(tcga_types_url).subscribe(
            data => {
                this.tcga_types_list = [];
                this.tcga_type_dict = {}
                console.log('Received:');
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
                console.log(this.tcga_type_dict);
                this.cdRef.markForCheck();
            }
        );

        let tissue_types_url = this.datasetTag + '?q=*:*&facet=on&facet.field=tissue_or_organ_of_origin&rows=0'
        this.pdService.makeSolrQuery(tissue_types_url).subscribe(
            data => {
                this.tissue_list = [];
                this.tissue_dict = {};
                console.log('Received:');
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
                console.log(this.tissue_dict);
                this.cdRef.markForCheck();
            }
        );

    }

    checkboxSelection(event, name: string) {
        console.log(event);
        console.log('name: ' + name);
        if(event['checked']){
            console.log('Check!');
            this.selectedNames.push(name);
        } else {
            console.log('NOT!');
            let index = this.selectedNames.indexOf(name);
            if (index > -1) {
                this.selectedNames.splice(index, 1);
            }
        }
        console.log('list: ' + this.selectedNames);
    }

    // Called when the user toggles between types so that we don't
    // combine selections based on both tcga types and tissue types.
    onTypeToggle(){

        this.selectedNames = [];
    }

    private getSampleIds(url_suffix: string){
        let id_list = [];
        this.pdService.makeSolrQuery(url_suffix).subscribe(
            data => {
                let doc_list = data['response']['docs'];
                for(let i=0; i<doc_list.length; i++){
                    id_list.push(doc_list[i]['id']);
                }
            }
        );
        console.log(id_list);
        return id_list;
    }

    createDataset(dataType: string){
        console.log('here~');
        console.log(dataType);
        let url_suffix = '';
        let payload = {};
        if(dataType === 'byType'){
            for(let i in this.selectedNames){
                let tcga_id = this.selectedNames[i];
                let count = this.tcga_type_dict[tcga_id];
                url_suffix = this.datasetTag + `?q=project_id:${tcga_id}&rows=${count}&fl=id`;
                payload[tcga_id] = this.getSampleIds(url_suffix);
            }
        } else if(dataType === 'byTissue'){
            for(let i in this.selectedNames){
                let tissue_name = this.selectedNames[i];
                let count = this.tissue_dict[tissue_name];
                url_suffix = this.datasetTag + `?q=tissue_or_organ_of_origin:${tissue_name}&rows=${count}&fl=id`;
            }
        }
        console.log(payload);
        let final_payload = {
            'filters': payload
        };
        this.pdService.createDataset('tcga-rnaseq',final_payload).subscribe();
    }
  }