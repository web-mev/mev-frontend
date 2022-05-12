import { Component, OnInit, OnChanges, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { environment } from '@environments/environment';
import { Options } from '@angular-slider/ngx-slider';


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
  queryRangeString = {};
  filterItems = {};
  filterRangeItems = {};
  facetField;
  searchQueryResults: string = "";
  checkBoxItems = [];


  // targetFields = ["ethnicity", "gender"]
  targetFields = ["ethnicity", "gender", "race", "vital_status", "cog_renal_stage", "last_known_disease_status", "morphology", "primary_diagnosis", "progression_or_recurrence", "site_of_resection_or_biopsy", "tissue_or_organ_of_origin", "tumor_grade", "dbgap_accession_number", "disease_type", "name", "primary_site", "project_id"];
  targetRangeFields = ["age_at_diagnosis", "days_to_last_follow_up", "year_of_diagnosis"];
  tcgaFields = ["alcohol_history", "ethnicity", "gender", "race", "vital_status", "vital_status", "ajcc_pathologic_m", "ajcc_pathologic_n", "ajcc_pathologic_stage", "ajcc_pathologic_t", "ajcc_staging_system_edition", "classification_of_tumor", "days_to_diagnosis", "icd_10_code", "last_known_disease_status", "morphology", "primary_diagnosis", "prior_malignancy", "prior_treatment", "progression_or_recurrence", "site_of_resection_or_biopsy", "synchronous_malignancy", "tissue_or_organ_of_origin", "tumor_grade", "disease_type", "name", "primary_site", "project_id"];
  tcgaRangeFields = ["age_at_diagnosis", "age_at_index", "days_to_birth", "days_to_last_follow_up", "year_of_birth", "year_of_diagnosis"];
  filterFields = [];
  filterRangeFields = [];

  minValue: number = 0;
  maxValue: number = 7000;
  options: Options = {
    floor: 0,
    ceil: 7000
  };

  dataSetNames = ['target-rnaseq', 'tcga-rnaseq'];
  storageDataSet = {
    'target-rnaseq': {
      'checkbox': {},
      'slider': {}
    },
    'tcga-rnaseq': {
      'checkbox': {},
      'slider': {}
    }
  };

  constructor(fb: FormBuilder, private httpClient: HttpClient, private ref: ChangeDetectorRef) { }

  ngOnInit(): void {
    // this.buildFacetFieldQueryRangeString(this.targetRangeFields[0], currDataSet, 0, 7000, 1000)
    // this.buildFacetFieldQueryRangeString(this.targetRangeFields[1], currDataSet, 0, 4000, 500)
    // this.buildFacetFieldQueryRangeString(this.targetRangeFields[2], currDataSet, 1980, 2022, 10)
  }

  afterLoaded() {
    for (let j = 0; j < this.dataSetNames.length; j++) {
      if (this.dataSetNames[j] === 'target-rnaseq') {
        this.filterFields = this.targetFields;
        this.filterRangeFields = this.targetRangeFields;
      } else if (this.dataSetNames[j] === 'tcga-rnaseq') {
        this.filterFields = this.tcgaFields;
        this.filterRangeFields = this.tcgaRangeFields;
      }

      // if (dataset.length > 0) {
        //builds the query string
        this.queryString = this.buildFacetFieldQueryString(this.filterFields, this.dataSetNames[j]);
        for (let i = 0; i < this.filterRangeFields.length; i++) {
          let category = this.filterRangeFields[i];
          this.queryRangeString[category] = this.buildFacetFieldQueryRangeString(category, this.dataSetNames[j], 0, 7000)
        }

        //gets the numbers for each category
        this.updateFilterValues(this.queryString, 'checkbox', this.storageDataSet[this.dataSetNames[j]]['checkbox']);
        for (let category in this.queryRangeString) {
          this.updateFilterValues(this.queryRangeString[category], 'rangeSlider', this.storageDataSet[this.dataSetNames[j]]['slider']);
        }
        console.log("results: ", this.storageDataSet);
      }
    // }

  }

  buildFacetFieldQueryString(categoryArray, dataset) {
    let query = `${this.API_URL}/public-datasets/query/${dataset}/?q=*&facet=true`;
    for (let i = 0; i < categoryArray.length; i++) {
      query += "&facet.field=" + categoryArray[i];
    }
    return query;
  }

  buildFacetFieldQueryRangeString(category, dataset, start, end) {
    let query = `${this.API_URL}/public-datasets/query/${dataset}/?q=*&facet=true`;
    let rangeGap = end - start;
    query += `&facet.field=${category}&facet.range=${category}&facet.range.start=${start}&facet.range.end=${end}&facet.range.gap=${rangeGap}`;
    return query;
  }

  getQueryResults(queryString) {
    return this.httpClient.get(queryString)
  }

  updateFilterValues(query, type, saveTo) {
    this.getQueryResults(query)
      .subscribe(res => {
        if (type === 'checkbox') {
          console.log('res: ', res)
          this.facetField = res['facet_counts']['facet_fields'];
          for (let cat in this.facetField) {
            let arr = this.facetField[cat]
            let obj = {}
            for (let i = 0; i < arr.length; i += 2) {
              obj[arr[i]] = arr[i + 1];
            }
            saveTo[cat] = obj;
          }
        } else if (type === 'rangeSlider') {
          let cat = res['responseHeader']['params']['facet.field']
          // this.filterRangeItems[cat] = res['response']['numFound']
          saveTo[cat] = res['response']['numFound'];
        }
      })
  }

  checkBoxObj = {};

  onChecked(currResult, cat, subcat) {
    let newQueryItem = `${cat}:"${subcat}"`;
    if (currResult === true) {
      if (!this.checkBoxObj[cat]) {
        this.checkBoxObj[cat] = [];
      }
      this.checkBoxObj[cat].push(newQueryItem);
    } else {
      this.checkBoxObj[cat] = this.checkBoxObj[cat].filter(item => item !== newQueryItem);
    }
  }

  filterData() {
    let newQueryString = '';
    for (let cat in this.checkBoxObj) {
      if (this.checkBoxObj[cat].length > 0) {
        let temp = "(" + this.checkBoxObj[cat].join(' OR ') + ")"
        if (newQueryString.length > 0) {
          newQueryString += " AND " + temp;
        } else {
          newQueryString += temp;
        }
      }
    }
    this.searchQueryResults = newQueryString;
  }

  setDataset(datasetTag: string) {
    this.currentDataset = datasetTag;
  }

  backToBrowse() {
    this.currentDataset = '';
  }

  // sliderValue: any = 0;
  // disableFilter: boolean = true;

  // updateSlider(input) {
  //   this.sliderValue = input.value;
  // }

  // filterEdges() {

  // }

}
