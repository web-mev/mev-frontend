import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
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
  queryStringForFilters: string = '';
  queryRangeString = '';
  filterItems = {};
  filterRangeItems = {};
  facetField;
  searchQueryResults: string = "";
  checkBoxItems = [];

  targetFields = ["ethnicity", "gender", "race", "vital_status", "cog_renal_stage", "last_known_disease_status", "morphology", "primary_diagnosis", "progression_or_recurrence", "site_of_resection_or_biopsy", "tissue_or_organ_of_origin", "tumor_grade", "dbgap_accession_number", "disease_type", "name", "primary_site", "project_id"];
  tcgaFields = ["alcohol_history", "ethnicity", "gender", "race", "vital_status", "vital_status", "ajcc_pathologic_m", "ajcc_pathologic_n", "ajcc_pathologic_stage", "ajcc_pathologic_t", "ajcc_staging_system_edition", "classification_of_tumor", "days_to_diagnosis", "icd_10_code", "last_known_disease_status", "morphology", "primary_diagnosis", "prior_malignancy", "prior_treatment", "progression_or_recurrence", "site_of_resection_or_biopsy", "synchronous_malignancy", "tissue_or_organ_of_origin", "tumor_grade", "disease_type", "name", "primary_site", "project_id"];
  // gtexFields = ["tissue", "sex", "age_range", "hardy_scale_death", "rna_rin", "nucleic_acid_isolation_batch", "expression_batch", "kit", "collection_site_code"];
  targetRangeFields = ["age_at_diagnosis", "days_to_last_follow_up", "year_of_diagnosis"];
  tcgaRangeFields = ["age_at_diagnosis", "age_at_index", "days_to_birth", "days_to_last_follow_up", "year_of_birth", "year_of_diagnosis"];
  // gtexRangeFields = []
  filterFields = {
    'target-rnaseq': this.targetFields,
    'tcga-rnaseq': this.tcgaFields,
    // 'gtex-rnaseq': this.gtexFields
  }
  filterRangeFields = {
    'target-rnaseq': this.targetRangeFields,
    'tcga-rnaseq': this.tcgaRangeFields,
    // 'gtex-rnaseq': this.gtexRangeFields
  };
  sliderMinMax = {
    'target-rnaseq': {
      "age_at_diagnosis": {
        "floor": 3,
        "ceil": 11828,
        "low": 3,
        "high": 11828
      },
      "days_to_last_follow_up": {
        "floor": 0,
        "ceil": 5938,
        "low": 0,
        "high": 5938
      },
      "year_of_diagnosis": {
        "floor": 1900,
        "ceil": 2015,
        "low": 1900,
        "high": 2015
      }
    },
    'tcga-rnaseq': {
      "age_at_diagnosis": {
        "floor": 5267,
        "ceil": 32872,
        "low": 5267,
        "high": 32872
      },
      "age_at_index": {
        "floor": 14,
        "ceil": 90,
        "low": 14,
        "high": 90
      },
      "days_to_birth": {
        "floor": -32872,
        "ceil": -5267,
        "low": -32872,
        "high": -5267
      },
      "days_to_last_follow_up": {
        "floor": -64,
        "ceil": 11252,
        "low": -64,
        "high": 11252
      },
      "year_of_birth": {
        "floor": 1902,
        "ceil": 1997,
        "low": 1902,
        "high": 1997
      },
      "year_of_diagnosis": {
        "floor": 1978,
        "ceil": 2013,
        "low": 1978,
        "high": 2013
      }
    },
    // "gtex-rnaseq": {}
  }


  dataSetNames = ['target-rnaseq', 'tcga-rnaseq'];
  storageDataSet = {
    'target-rnaseq': {},
    'tcga-rnaseq': {},
    // 'gtex-rnaseq': {},
  };
  checkBoxObj = {};
  checkboxStatus = {}
  sliderObj = {
    'target-rnaseq': {},
    'tcga-rnaseq': {},
  };
  isLoading = true;

  constructor(fb: FormBuilder, private httpClient: HttpClient, private ref: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.isLoading = true;
  }
  count = 0
  afterLoaded() {
    for (let dataset in this.filterRangeFields) {
      this.queryRangeString = this.buildFacetFieldQueryRangeString(this.filterRangeFields[dataset], dataset);

      //builds the initial query string
      this.queryStringForFilters = this.buildFacetFieldQueryString(dataset);

      //gets the numbers for each category
      this.updateFilterValues(this.queryStringForFilters, 'checkbox', this.storageDataSet[dataset], dataset);
      // this.updateFilterValues(this.queryRangeString, 'rangeSlider', this.storageDataSet[dataset], dataset);
    }
  }

  buildFacetFieldQueryString(dataset) {
    let categoryArray = this.filterFields[dataset]
    let query = `${this.API_URL}/public-datasets/query/${dataset}/?q=*&facet=true`;
    for (let i = 0; i < categoryArray.length; i++) {
      query += "&facet.field=" + categoryArray[i];
    }
    let categoryArrayRange = this.filterRangeFields[dataset]
    let rangeQuery = '';
    for (let k = 0; k < categoryArrayRange.length; k++) {
      let category = categoryArrayRange[k];
      let low = this.sliderMinMax[dataset][category]['low'];
      let high = this.sliderMinMax[dataset][category]['high'];
      rangeQuery += `&facet.query={!tag=q1}${category}:[${low} TO ${high}]`
    }
    query += rangeQuery;
    return query;
  }

  updateFacetFieldQueryString(dataset, filterItems) {
    let categoryArray = this.filterFields[dataset]
    let tempQuery = filterItems.length === 0 ? '*' : filterItems;
    let query = `${this.API_URL}/public-datasets/query/${dataset}/?q=${tempQuery}&facet=true`;

    for (let i = 0; i < categoryArray.length; i++) {
      query += "&facet.field=" + categoryArray[i];
    }
    let categoryArrayRange = this.filterRangeFields[dataset]
    let rangeQuery = '';
    for (let k = 0; k < categoryArrayRange.length; k++) {
      let category = categoryArrayRange[k];
      let low = this.sliderMinMax[dataset][category]['low'];
      let high = this.sliderMinMax[dataset][category]['high'];
      rangeQuery += `&facet.query={!tag=q1}${category}:[${low} TO ${high}]`
    }
    query += rangeQuery;
    return query;
  }

  buildFacetFieldQueryRangeString(categoryArrayRange, dataset) {
    let query;
    let rangeQuery = '';
    for (let k = 0; k < categoryArrayRange.length; k++) {
      let category = categoryArrayRange[k];
      let low = this.sliderMinMax[dataset][category]['low'];
      let high = this.sliderMinMax[dataset][category]['high'];
      rangeQuery += `&facet.query={!tag=q1}${category}:[${low} TO ${high}]`
    }
    query = `${this.API_URL}/public-datasets/query/${dataset}/?q=*&facet=true` + rangeQuery;
    return query;
  }

  getQueryResults(queryString) {
    return this.httpClient.get(queryString)
  }

  //change this later to only run one time
  initial = 0;

  updateFilterValues(query, type, saveTo, dataset) {
    this.isLoading = true;
    this.getQueryResults(query)
      .subscribe(res => {
        if (type === 'checkbox') {
          this.facetField = res['facet_counts']['facet_fields'];
          for (let cat in this.facetField) {
            let arr = this.facetField[cat]
            let obj = {};
            let obj2 = {};
            for (let i = 0; i < arr.length; i += 2) {
              obj[arr[i]] = arr[i + 1];

              //need to change this hard value
              if (this.initial === 0) {
                obj2[arr[i]] = false;
              }
            }
            saveTo[cat] = obj;
            if (this.initial === 0) {
              this.checkboxStatus[cat] = obj2
            }
          }
          //for the range queries only
          let facet_queries = res["facet_counts"]["facet_queries"]
          for (let item in facet_queries) {
            let indexOfColon = item.indexOf(':')
            let cat = item.slice(9, indexOfColon)
            let min = this.sliderMinMax[dataset][cat]['low']
            let max = this.sliderMinMax[dataset][cat]['high']
            if (saveTo['range'] === undefined) {
              saveTo['range'] = {};
            }
            if (saveTo['range'][cat] === undefined) {
              saveTo['range'][cat] = {};
            }
            saveTo['range'][cat] = {
              "count": res["facet_counts"]['facet_queries'][item],
              "low": 0,
              "high": 100
            }
            console.log("storage after update: ", this.storageDataSet, dataset, item, cat)
          }
        }
        // maybe remove??
        else if (type === 'rangeSlider') {
          let facet_queries = res["facet_counts"]["facet_queries"]
          for (let item in facet_queries) {
            let indexOfColon = item.indexOf(':')
            let cat = item.slice(9, indexOfColon)
            let min = this.sliderMinMax[dataset][cat]['low']
            let max = this.sliderMinMax[dataset][cat]['high']
            saveTo["range"][cat] = {
              "count": res["facet_counts"]['facet_queries'][item],
              "low": min,
              "high": max
            }
          }
        }
        this.initial++;
      })
    this.isLoading = false;
  }

  onChecked(currResult, cat, subcat, dataset) {
    let newQueryItem = `${cat}:"${subcat}"`;
    if (currResult === true) {
      if (!this.checkBoxObj[cat]) {
        this.checkBoxObj[cat] = [];
      }
      this.checkBoxObj[cat].push(newQueryItem);
      this.checkboxStatus[cat][subcat] = true;

    } else if (currResult === false) {
      this.checkBoxObj[cat] = this.checkBoxObj[cat].filter(item => item !== newQueryItem);
      this.checkboxStatus[cat][subcat] = false;
    }
    this.filterData(dataset)
    // console.log(this.checkBoxObj, this.checkboxStatus)
    console.log("storage: ", this.storageDataSet)
  }

  onSliderChange(dataset, category, low, high, count) {
    // this.sliderMinMax[dataset][category]['low'] = low;
    // this.sliderMinMax[dataset][category]['high'] = high;

    // this.queryRangeString = this.buildFacetFieldQueryRangeString(this.filterRangeFields[dataset], dataset);
    // this.updateFilterValues(this.queryRangeString, 'rangeSlider', this.storageDataSet[dataset], dataset);
  }

  filterData(dataset) {
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
    let temp = this.updateFacetFieldQueryString(this.currentDataset, this.searchQueryResults)
    this.updateFilterValues(temp, 'checkbox', this.storageDataSet[this.currentDataset], dataset)
  }

  setDataset(datasetTag: string) {
    this.currentDataset = datasetTag;
  }

  backToBrowse() {
    this.currentDataset = '';
  }

}
