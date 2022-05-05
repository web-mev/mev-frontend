import { Component, OnInit, OnChanges, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { environment } from '@environments/environment';


@Component({
  selector: 'mev-public-datasets',
  templateUrl: './public-datasets.component.html',
  styleUrls: ['./public-datasets.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PublicDatasetsComponent implements OnInit {
  private readonly API_URL = environment.apiUrl;
  currentDataset = '';
  isLoading: boolean = false;
  target: FormGroup;
  queryString: string;
  filterItems = {};
  facetField;
  searchQueryResults: string = "pass the results along with this"

  // filterItems = {
  // gender: {
  //   "male": 10,
  //   "female": 20,
  // },
  // }

  // targetFields = ["gender"]
  targetFields = ["ethnicity", "gender", "race", "vital_status", "cog_renal_stage", "last_known_disease_status", "morphology", "primary_diagnosis", "progression_or_recurrence", "site_of_resection_or_biopsy", "tissue_or_organ_of_origin", "tumor_grade", "dbgap_accession_number", "disease_type", "name", "primary_site", "project_id"];
  targetRangeFields = ["age_at_diagnosis", "days_to_last_follow_up", "year_of_diagnosis"]

  constructor(fb: FormBuilder, private httpClient: HttpClient, private ref: ChangeDetectorRef) {
    //this needs to be initialized for checkboxes
    this.target = fb.group({});
  }

  ngOnInit(): void {
    this.isLoading = true;
    let currDataSet = 'target-rnaseq';
    // this.addToQuery(this.filterItems, currDataSet);
    this.queryString = this.buildFacetFieldQueryString(this.targetFields, currDataSet);

    this.buildFacetFieldQueryRangeString(this.targetRangeFields[0], currDataSet, 0, 7000, 1000)
    this.buildFacetFieldQueryRangeString(this.targetRangeFields[1], currDataSet, 0, 4000, 500)
    this.buildFacetFieldQueryRangeString(this.targetRangeFields[2], currDataSet, 1980, 2022, 10)

    this.modifyQueryResults()
  }

  buildFacetFieldQueryString(categoryArray, dataset) {
    let query = `${this.API_URL}/public-datasets/query/${dataset}/?q=*&facet=true`;
    for (let i = 0; i < categoryArray.length; i++) {
      query += "&facet.field=" + categoryArray[i];
    }
    return query;
  }

  buildFacetFieldQueryRangeString(category, dataset, start, end, gap) {
    let query = `${this.API_URL}/public-datasets/query/${dataset}/?q=*&facet=true`;
    query += `&facet.field=${category}&facet.range=${category}&facet.range.start=${start}&facet.range.end=${end}&facet.range.gap=${gap}`;
    return query;
  }

  getQueryResults(queryString) {
    return this.httpClient.get(queryString)
  }


  modifyQueryResults() {
    this.getQueryResults(this.queryString)
      .subscribe(res => {
        this.facetField = res['facet_counts']['facet_fields'];
        for (let cat in this.facetField) {
          let arr = this.facetField[cat]
          let obj = {}
          for (let i = 0; i < arr.length; i += 2) {
            obj[arr[i]] = arr[i + 1];
            this.target.addControl(arr[i], new FormControl(false))
          }
          let temp = cat.toString()
          this.filterItems[temp] = obj;
        }
        this.isLoading = false;
      })
  }

  setDataset(datasetTag: string) {
    this.currentDataset = datasetTag;
  }

  backToBrowse() {
    this.currentDataset = '';
  }

  // addToQuery(searchItem, dataset) {
  //   for (let cat in searchItem) {
  //     for (let i in searchItem[cat]) {
  //       this.getResults(cat, i, dataset)
  //         .subscribe(res => {
  //           // console.log("query results: ", res['response'])
  //           this.filterItems[cat][i] = res['response']['numFound'];
  //         })
  //     }
  //     this.isLoading = false;
  //   }
  //   // console.log("filter logs: ", this.filterItems)
  // }


  // getResults(category, item, dataset) {
  //   let query = `${this.API_URL}/public-datasets/query/${dataset}/?q=${category}:"${item}"`;
  //   this.searchQuery = `${category}="${item}"`
  //   // console.log("query:", query)
  //   return this.httpClient.get(query)
  // }

}
