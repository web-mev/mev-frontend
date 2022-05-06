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
  queryString: string = '';
  filterItems = {};
  facetField;
  searchQueryResults: string = "";
  checkBoxItems = [];


  // targetFields = ["ethnicity", "gender"]
  targetFields = ["ethnicity", "gender", "race", "vital_status", "cog_renal_stage", "last_known_disease_status", "morphology", "primary_diagnosis", "progression_or_recurrence", "site_of_resection_or_biopsy", "tissue_or_organ_of_origin", "tumor_grade", "dbgap_accession_number", "disease_type", "name", "primary_site", "project_id"];
  targetRangeFields = ["age_at_diagnosis", "days_to_last_follow_up", "year_of_diagnosis"];
  tcgaFields = ["alcohol_history", "ethnicity", "gender", "race", "vital_status", "vital_status", "ajcc_pathologic_m", "ajcc_pathologic_n", "ajcc_pathologic_stage", "ajcc_pathologic_t", "ajcc_staging_system_edition", "classification_of_tumor", "days_to_diagnosis", "icd_10_code", "last_known_disease_status", "morphology", "primary_diagnosis", "prior_malignancy", "prior_treatment", "progression_or_recurrence", "site_of_resection_or_biopsy", "synchronous_malignancy", "tissue_or_organ_of_origin", "tumor_grade", "disease_type", "name", "primary_site", "project_id"];
  tcgaRangeFields = ["age_at_diagnosis", "age_at_index", "days_to_birth", "days_to_last_follow_up", "year_of_birth", "year_of_diagnosis"];
  filterFields = [];

  constructor(fb: FormBuilder, private httpClient: HttpClient, private ref: ChangeDetectorRef) { }

  ngOnInit(): void {

    // let currDataSet = 'target-rnaseq';
    // if (currDataSet.length > 0) {
    //   this.queryString = this.buildFacetFieldQueryString(this.targetFields, currDataSet);
    //   this.updateFilterValues();
    // }


    // this.buildFacetFieldQueryRangeString(this.targetRangeFields[0], currDataSet, 0, 7000, 1000)
    // this.buildFacetFieldQueryRangeString(this.targetRangeFields[1], currDataSet, 0, 4000, 500)
    // this.buildFacetFieldQueryRangeString(this.targetRangeFields[2], currDataSet, 1980, 2022, 10)
  }

  afterLoaded(dataset) {
    console.log("dataset: ", dataset)
    if (dataset === 'target-rnaseq') {
      this.filterFields = this.targetFields;
    } else if (dataset === 'tcga-rnaseq') {
      this.filterFields = this.tcgaFields;
    }

    if (dataset.length > 0) {
      this.queryString = this.buildFacetFieldQueryString(this.filterFields, dataset);
      this.updateFilterValues();
    }
  }

  buildFacetFieldQueryString(categoryArray, dataset) {
    let query = `${this.API_URL}/public-datasets/query/${dataset}/?q=*&facet=true`;
    for (let i = 0; i < categoryArray.length; i++) {
      query += "&facet.field=" + categoryArray[i];
    }
    return query;
  }

  // buildFacetFieldQueryRangeString(category, dataset, start, end, gap) {
  //   let query = `${this.API_URL}/public-datasets/query/${dataset}/?q=*&facet=true`;
  //   query += `&facet.field=${category}&facet.range=${category}&facet.range.start=${start}&facet.range.end=${end}&facet.range.gap=${gap}`;
  //   return query;
  // }

  getQueryResults(queryString) {
    return this.httpClient.get(queryString)
  }

  updateFilterValues() {
    this.getQueryResults(this.queryString)
      .subscribe(res => {
        this.facetField = res['facet_counts']['facet_fields'];
        for (let cat in this.facetField) {
          let arr = this.facetField[cat]
          let obj = {}
          for (let i = 0; i < arr.length; i += 2) {
            obj[arr[i]] = arr[i + 1];
          }
          this.filterItems[cat] = obj;
        }
      })
  }

  onChecked(currResult, cat, subcat) {
    let newQueryItem = `${cat}:"${subcat}"`;
    if (currResult === true) {
      this.checkBoxItems.push(newQueryItem);
    } else {
      this.checkBoxItems = this.checkBoxItems.filter(item => item !== newQueryItem);
    }
  }

  filterData() {
    let newQueryString = this.checkBoxItems.join(' AND ');
    this.searchQueryResults = newQueryString;
  }

  setDataset(datasetTag: string) {
    this.currentDataset = datasetTag;
  }

  backToBrowse() {
    this.currentDataset = '';
  }

}
