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
  queryRangeString = {
    'target-rnaseq': {},
    'tcga-rnaseq': {},
    'gtex-rnaseq': {},
  };
  filterItems = {};
  filterRangeItems = {};
  facetField;
  searchQueryResults: string = "";
  checkBoxItems = [];

  targetFields = ["ethnicity", "gender", "race", "vital_status", "cog_renal_stage", "last_known_disease_status", "morphology", "primary_diagnosis", "progression_or_recurrence", "site_of_resection_or_biopsy", "tissue_or_organ_of_origin", "tumor_grade", "dbgap_accession_number", "disease_type", "name", "primary_site", "project_id"];
  tcgaFields = ["alcohol_history", "ethnicity", "gender", "race", "vital_status", "vital_status", "ajcc_pathologic_m", "ajcc_pathologic_n", "ajcc_pathologic_stage", "ajcc_pathologic_t", "ajcc_staging_system_edition", "classification_of_tumor", "days_to_diagnosis", "icd_10_code", "last_known_disease_status", "morphology", "primary_diagnosis", "prior_malignancy", "prior_treatment", "progression_or_recurrence", "site_of_resection_or_biopsy", "synchronous_malignancy", "tissue_or_organ_of_origin", "tumor_grade", "disease_type", "name", "primary_site", "project_id"];
  gtexFields = [];
  targetRangeFields = ["age_at_diagnosis", "days_to_last_follow_up", "year_of_diagnosis"];
  tcgaRangeFields = ["age_at_diagnosis", "age_at_index", "days_to_birth", "days_to_last_follow_up", "year_of_birth", "year_of_diagnosis"];
  gtexRangeFields = []
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
        "min": 3,
        "max": 11828
      },
      "days_to_last_follow_up": {
        "min": 0,
        "max": 5938
      },
      "year_of_diagnosis": {
        "min": 1900,
        "max": 2015
      }
    },
    'tcga-rnaseq': {
      "age_at_diagnosis": {
        "min": 5267,
        "max": 32872
      },
      "age_at_index": {
        "min": 14,
        "max": 90
      },
      "days_to_birth": {
        "min": -32872,
        "max": -5267
      },
      "days_to_last_follow_up": {
        "min": -64,
        "max": 11252
      },
      "year_of_birth": {
        "min": 1902,
        "max": 1997
      },
      "year_of_diagnosis": {
        "min": 1978,
        "max": 2013
      }
    }
  }


  dataSetNames = ['target-rnaseq', 'tcga-rnaseq'];
  storageDataSet = {
    'target-rnaseq': {},
    'tcga-rnaseq': {},
    // 'gtex-rnaseq': {},
  };
  checkBoxObj = {};
  checkboxStatus = {}
  isLoading = true;

  constructor(fb: FormBuilder, private httpClient: HttpClient, private ref: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.isLoading = true;
  }

  afterLoaded() {
    for (let dataset in this.filterRangeFields) {

      this.queryRangeString = this.buildFacetFieldQueryRangeString(this.filterRangeFields[dataset], this.filterFields[dataset], dataset);
      console.log("query range string: ", this.queryRangeString)
      //builds the initial query string
      this.queryStringForFilters = this.buildFacetFieldQueryString(this.filterFields[dataset], this.filterRangeFields[dataset], dataset);
      console.log("query string for filters: ", this.queryStringForFilters)

      //gets the numbers for each category
      this.updateFilterValues(this.queryStringForFilters, 'checkbox', this.storageDataSet[dataset], dataset);
      this.updateFilterValues(this.queryRangeString, 'rangeSlider', this.storageDataSet[dataset], dataset);
      // for (let category in this.queryRangeString[dataset]) {
      //   this.updateFilterValues(this.queryRangeString[dataset][category], 'rangeSlider', this.storageDataSet[dataset]['slider']);
      // }
    }
    console.log("storage: ", this.storageDataSet)
  }

  buildFacetFieldQueryString(categoryArray, categoryRangeArray, dataset) {
    let query = `${this.API_URL}/public-datasets/query/${dataset}/?q=*&facet=true`;
    for (let i = 0; i < categoryArray.length; i++) {
      query += "&facet.field=" + categoryArray[i];
    }

    // for (let j = 0; j < categoryRangeArray.length; j++) {
    //   query += "&facet.field=" + categoryRangeArray[j];
    // }

    return query;
  }

  updateFacetFieldQueryString(categoryArray, dataset, filterItems) {
    // console.log("filter items from update: ", filterItems)
    let tempQuery = filterItems.length === 0 ? '*' : filterItems;
    let query = `${this.API_URL}/public-datasets/query/${dataset}/?q=${tempQuery}&facet=true`;

    for (let i = 0; i < categoryArray.length; i++) {
      query += "&facet.field=" + categoryArray[i];
    }
    return query;
  }

  buildFacetFieldQueryRangeString(categoryArrayRange, categoryArrayCheckbox, dataset) {

    // let min, max;
    // let minMaxQuery = `${this.API_URL}/public-datasets/query/${dataset}/?q=*&facet=true&facet.field=${category}&stats=true&stats.field={!tag=piv1,piv2%20min=true%20max=true}${category}`
    // this.getQueryResults(minMaxQuery).subscribe(res => {
    //   console.log("res: ", res["stats"].stats_fields[category], dataset, category)
    //   min = res["stats"].stats_fields[category]['min'];
    //   max = res["stats"].stats_fields[category]['max'];
    //   console.log("min/max ", min, max, category, dataset)


    //   // let rangeGap = end - start;
    //   // let rangeGap = max - min;

    // })
    let query;
    let rangeQuery = '';
    for (let k = 0; k < categoryArrayRange.length; k++) {
      let category = categoryArrayRange[k];
      let min = this.sliderMinMax[dataset][category]['min']
      let max = this.sliderMinMax[dataset][category]['max']
      rangeQuery += `&facet.query={!tag=q1}${category}:[${min} TO ${max}]`

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
    // console.log("update filter values: ", query)
    this.isLoading = true;
    this.getQueryResults(query)
      .subscribe(res => {
        console.log("res: ", res)
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
        } else if (type === 'rangeSlider') {
          let facet_queries = res["facet_counts"]["facet_queries"]
          for (let item in facet_queries) {
            let indexOfColon = item.indexOf(':')
            let cat = item.slice(9, indexOfColon)
            // saveTo[cat]["count"] = res["facet_counts"]['facet_queries'][item];
            let min = this.sliderMinMax[dataset][cat]['min']
            let max = this.sliderMinMax[dataset][cat]['max']
            saveTo[cat] = {
              "count": res["facet_counts"]['facet_queries'][item],
              "min": min,
              "max": max
            }
          }

        }
        this.initial++
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
  }

  onSliderChange(dataset, category, low, high) {
    // console.log("slider from storageDS: ", this.storageDataSet[dataset])
    // this.queryRangeString[dataset][category] = this.buildFacetFieldQueryRangeString(category, dataset, low, high)
    // console.log("query range string: ", this.queryRangeString)
    // this.updateFilterValues(this.queryRangeString[dataset][category], 'rangeSlider', this.storageDataSet[dataset]['slider']);
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
    let temp = this.updateFacetFieldQueryString(this.filterFields[this.currentDataset], this.currentDataset, this.searchQueryResults)
    this.updateFilterValues(temp, 'checkbox', this.storageDataSet[this.currentDataset], dataset)
  }

  setDataset(datasetTag: string) {
    this.currentDataset = datasetTag;
  }

  backToBrowse() {
    this.currentDataset = '';
  }

}
