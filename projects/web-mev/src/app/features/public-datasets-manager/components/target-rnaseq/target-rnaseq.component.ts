import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Input
} from '@angular/core';
import { FileService } from '@app/features/file-manager/services/file-manager.service';
import { NotificationService } from '@core/notifications/notification.service';
import { PublicDatasetService } from '../../services/public-datasets.service';
import { GdcRnaseqComponent } from '../gdc_base/gdc-base.component';
import { MatDialog } from '@angular/material/dialog';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'target-rnaseq-explorer',
  templateUrl: './target-rnaseq.component.html',
  styleUrls: ['./target-rnaseq.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TargetRnaseqComponent extends GdcRnaseqComponent implements OnInit {
  @Input() query: string = "placeholder for nowx"
  datasetTag = 'target-rnaseq';
  name_map_key = 'target_type_to_name_map'

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
    this.fetchData2(this.datasetTag, this.name_map_key);
  }

  createDataset(dataType: string) {
    this._createDataset(dataType, this.datasetTag);
  }

  fetchData2(datasetTag: string, name_map_key: string): void {
    console.log("this is running fetch data 2: ", this.query)

    // this object ties together multiple requests so that all the data can be combined 
    // at once. The prepare the TCGA display we need two sources of info-
    // 1. the faceted results detailing how many samples are available in each cancer type
    // 2. the human-readable names so that it's clear what "TCGA-LUAD" means.
    // The first comes from a solr query. The second comes from the database. To prepare
    // the interface, we need both
    let $observable_dict = {};
    let facet_list = [];
    let types_url = datasetTag + '/?q=*:*&facet=on&facet.field=project_id&rows=0' + `&${this.query}`
    $observable_dict['solr_query'] = this.pdService.makeSolrQuery(types_url);
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

    let tissue_types_url = datasetTag + '?q=*:*&facet=on&facet.field=tissue_or_organ_of_origin&rows=0' + `&${this.query}`
    console.log("tissue type url: ",tissue_types_url)
    this.pdService.makeSolrQuery(tissue_types_url).subscribe(
      data => {
        console.log("tissue data: ", data)
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
}