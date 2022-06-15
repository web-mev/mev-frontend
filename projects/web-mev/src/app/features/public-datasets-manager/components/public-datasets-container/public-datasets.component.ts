import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';

@Component({
  selector: 'mev-public-datasets',
  templateUrl: './public-datasets.component.html',
  styleUrls: ['./public-datasets.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PublicDatasetsComponent implements OnInit {
  private readonly API_URL = environment.apiUrl;
  currentDataset: string = '';
  queryStringForFilters: string = '';
  queryRangeString: string = '';
  filterItems = {};
  filterRangeItems = {};
  facetField;
  searchQueryResults: string = "";
  checkBoxItems = [];
  isLoading: boolean = false;

  targetFields = ["ethnicity", "gender", "race", "vital_status", "cog_renal_stage", "morphology", "primary_diagnosis", "site_of_resection_or_biopsy", "dbgap_accession_number", "disease_type", "name", "primary_site"];
  tcgaFields = ["alcohol_history", "ethnicity", "gender", "race", "vital_status", "vital_status", "ajcc_pathologic_m", "ajcc_pathologic_n", "ajcc_pathologic_stage", "ajcc_pathologic_t", "ajcc_staging_system_edition", "icd_10_code", "morphology", "primary_diagnosis", "prior_malignancy", "prior_treatment", "site_of_resection_or_biopsy", "synchronous_malignancy", "disease_type", "name", "primary_site"];
  gtexFields = ["sex", "age_range", "hardy_scale_death", "nucleic_acid_isolation_batch", "expression_batch", "collection_site_code"];
  targetRangeFields = ["age_at_diagnosis", "days_to_last_follow_up", "year_of_diagnosis"]; //"days_to_death", "days_to_birth"
  tcgaRangeFields = ["age_at_diagnosis", "age_at_index", "days_to_birth", "days_to_last_follow_up", "year_of_birth", "year_of_diagnosis"];
  gtexRangeFields = ["rna_rin"];
  advanceFields = ["cog_renal_stage", "dbgap_accession_number", "morphology", "disease_type", "primary_site", "site_of_resection_or_biopsy", "days_to_last_follow_up", "ajcc_pathologic_m", "ajcc_pathologic_n", "ajcc_pathologic_t", "ajcc_staging_system_edition", "alcohol_history", "icd_10_code", "synchronous_malignancy", "age_at_index", "days_to_birth", "year_of_birth", "year_of_diagnosis", "nucleic_acid_isolation_batch", "expression_batch", "collection_site_code", "rna_rin"];
  filterFields = {
    'target-rnaseq': this.targetFields,
    'tcga-rnaseq': this.tcgaFields,
    'gtex-rnaseq': this.gtexFields
  }
  filterRangeFields = {
    'target-rnaseq': this.targetRangeFields,
    'tcga-rnaseq': this.tcgaRangeFields,
    'gtex-rnaseq': this.gtexRangeFields
  };
  sliderStorage = {
    'target-rnaseq': {
      "age_at_diagnosis": {
        "count": 0,
        "floor": 3,
        "ceil": 11828,
        "low": 3,
        "high": 11828,
        "not_reported": true
      },
      "days_to_last_follow_up": {
        "count": 0,
        "floor": 0,
        "ceil": 5938,
        "low": 0,
        "high": 5938,
        "not_reported": true
      },
      "year_of_diagnosis": {
        "count": 0,
        "floor": 1900,
        "ceil": 2015,
        "low": 1900,
        "high": 2015,
        "not_reported": true
      }
    },
    'tcga-rnaseq': {
      "age_at_diagnosis": {
        "count": 0,
        "floor": 5267,
        "ceil": 32872,
        "low": 5267,
        "high": 32872,
        "not_reported": true
      },
      "age_at_index": {
        "count": 0,
        "floor": 14,
        "ceil": 90,
        "low": 14,
        "high": 90,
        "not_reported": true
      },
      "days_to_birth": {
        "count": 0,
        "floor": -32872,
        "ceil": -5267,
        "low": -32872,
        "high": -5267,
        "not_reported": true
      },
      "days_to_last_follow_up": {
        "count": 0,
        "floor": -64,
        "ceil": 11252,
        "low": -64,
        "high": 11252,
        "not_reported": true
      },
      "year_of_birth": {
        "count": 0,
        "floor": 1902,
        "ceil": 1997,
        "low": 1902,
        "high": 1997,
        "not_reported": true
      },
      "year_of_diagnosis": {
        "count": 0,
        "floor": 1978,
        "ceil": 2013,
        "low": 1978,
        "high": 2013,
        "not_reported": true
      }
    },
    "gtex-rnaseq": {
      "rna_rin": {
        "count": 0,
        "floor": 3,
        "ceil": 10,
        "low": 3,
        "high": 10,
        "not_reported": true
      },
    }
  }

  storageDataSet = {};
  //checkbox object keeps track of which items are checked
  checkBoxObj = {};
  //checkbox status keeps track of every checkbox for true/false values
  checkboxStatus = {}
  altStorage = {}
  displayAdvance: boolean = false;
  excludeList = [];
  mainQuery: string = "*";

  constructor(fb: FormBuilder, private httpClient: HttpClient, private ref: ChangeDetectorRef) { }

  ngOnInit(): void { }

  initializeFilterData() {
    for (let dataset in this.filterFields) {
      this.createRangeDataStorage(dataset);
      //builds the initial query string
      this.queryStringForFilters = this.getFacetFieldQuery(dataset);
      this.createAltQuery(dataset)

      if (!this.storageDataSet[dataset]) {
        this.storageDataSet[dataset] = {}
      }
      if (!this.checkboxStatus[dataset]) {
        this.checkboxStatus[dataset] = {}
      }
      //gets the numbers for each category
      this.updateFilterValues(this.queryStringForFilters, this.checkboxStatus[dataset], dataset, true);
    }
  }


  createRangeDataStorage(dataset) {
    //example of the query
    //https://api-dev.tm4.org/api/public-datasets/query/target-rnaseq/?q=*&stats=true&stats.field={!tag=piv1,piv2%20min=true%20max=true}age_at_diagnosis
    let categoryArray = this.filterRangeFields[dataset];
    let query = `${this.API_URL}/public-datasets/query/${dataset}/?q=*&stats=true`;
    for (let i = 0; i < categoryArray.length; i++) {
      query += `&stats.field={!tag=piv1,piv2 min=true max=true}${categoryArray[i]}`
    }
    this.getQueryResults(query)
      .subscribe(res => {
        let stats_field = res["stats"]["stats_fields"];
        for (let cat in stats_field) {
          if (!this.sliderStorage[dataset]) {
            this.sliderStorage[dataset] = {};
          }
          this.sliderStorage[dataset][cat] = {
            "count": 0,
            "floor": stats_field[cat]["min"],
            "ceil": stats_field[cat]["max"],
            "low": stats_field[cat]["min"],
            "high": stats_field[cat]["max"],
            "not_reported": true
          }
        }

      })
  }

  getFacetFieldQuery(dataset) {
    let categoryArray = this.filterFields[dataset]
    let query = `${this.API_URL}/public-datasets/query/${dataset}/?q=*&facet=true`;
    for (let i = 0; i < categoryArray.length; i++) {
      query += "&facet.field=" + categoryArray[i];
    }
    let categoryArrayRange = this.filterRangeFields[dataset]
    let rangeQuery = '';
    for (let k = 0; k < categoryArrayRange.length; k++) {
      let category = categoryArrayRange[k];
      let low = this.sliderStorage[dataset][category]['low'];
      let high = this.sliderStorage[dataset][category]['high'];
      rangeQuery += `&facet.query={!tag=q1}${category}:[${low} TO ${high}]`
    }
    query += rangeQuery;
    return query;
  }

  addSearchQuery(dataset, filterItems) {
    let categoryArrayRange = this.filterRangeFields[dataset]
    let rangeQuery = '';
    let missingRangeQuery = '';
    for (let k = 0; k < categoryArrayRange.length; k++) {
      let category = categoryArrayRange[k];
      let low = this.sliderStorage[dataset][category]['low'];
      let high = this.sliderStorage[dataset][category]['high'];
      rangeQuery += `&facet.query={!tag=q1}${category}:[${low} TO ${high}]`;
      missingRangeQuery += (missingRangeQuery.length === 0) ? `(* -${category}:*)` : ` OR (* -${category}:*)`;
    }

    let categoryArray = this.filterFields[dataset]
    // let tempQuery = filterItems.length === 0 ? missingRangeQuery : `${filterItems} OR ${missingRangeQuery}`;
    let tempQuery = filterItems.length === 0 ? missingRangeQuery : `${filterItems}`;
    let query = `${this.API_URL}/public-datasets/query/${dataset}/?q=${tempQuery}&facet=true`;

    for (let i = 0; i < categoryArray.length; i++) {
      query += "&facet.field=" + categoryArray[i];
    }
    this.mainQuery = tempQuery;
    query += rangeQuery;
    return query;
  }

  getQueryResults(queryString) {
    return this.httpClient.get(queryString)
  }

  updateFilterValues(query, checkboxStatus, dataset, initializeCheckbox) {
    this.getQueryResults(query)
      .subscribe(res => {
        this.facetField = res['facet_counts']['facet_fields'];
        for (let category in this.facetField) {
          let arr = this.facetField[category]
          let checkboxStatusObj = {}; //this is for checkbox status
          this.storageDataSet[dataset][category] = [];
          if (!this.altStorage[dataset]) {
            this.altStorage[dataset] = {}
          }
          if (!this.altStorage[dataset][category]) {
            this.altStorage[dataset][category] = {
              "altQuery": '',
              "data": []
            };
          }
          if (!this.checkBoxObj[dataset][category]) {
            this.altStorage[dataset][category]["data"] = [];
          }
          if (initializeCheckbox) {
            for (let j = 0; j < arr.length; j += 2) {
              let countObj = {};
              countObj[arr[j]] = arr[j + 1];
              checkboxStatusObj[arr[j]] = false;
              this.storageDataSet[dataset][category].push(countObj);
              checkboxStatus[category] = checkboxStatusObj;
              if (!this.checkBoxObj[dataset][category]) {
                this.altStorage[dataset][category]["data"].push(countObj);
              }
            }
          } else {
            for (let i = 0; i < arr.length; i += 2) {
              let countObj = {};
              countObj[arr[i]] = arr[i + 1];

              //if it does exist, look for that id and replace, else just add it
              this.storageDataSet[dataset][category].push(countObj);

              ///need to remove items from the array before pushing them
              if (!this.checkBoxObj[dataset][category]) {
                this.altStorage[dataset][category]["data"].push(countObj);
              }
            }
          }

        }
        //for the range queries only
        let facet_queries = res["facet_counts"]["facet_queries"];
        for (let item in facet_queries) {
          let indexOfColon = item.indexOf(':')
          let category = item.slice(9, indexOfColon)
          let count = res["facet_counts"]['facet_queries'][item];
          this.sliderStorage[dataset][category]['count'] = count;
        }
      })
  }

  onChecked(isChecked, category, subcategory, dataset) {
    if (!this.checkBoxObj[dataset]) {
      this.checkBoxObj[dataset] = {};
    }
    let newQueryItem = `${category}:"${subcategory}"`;
    if (isChecked) {
      if (!this.checkBoxObj[dataset][category]) {
        this.checkBoxObj[dataset][category] = [];
      }
      this.checkBoxObj[dataset][category].push(newQueryItem);
      this.checkboxStatus[dataset][category][subcategory] = true;

    } else if (!isChecked) {
      this.checkBoxObj[dataset][category] = this.checkBoxObj[dataset][category].filter(item => item !== newQueryItem);
      if (this.checkBoxObj[dataset][category].length === 0) {
        delete this.checkBoxObj[dataset][category]
      }
      this.checkboxStatus[dataset][category][subcategory] = false
    }
    this.createAltQuery(dataset);
    this.filterData(dataset);
  }

  onNotReportedChecked(result) {
    let temp = result.dataset + "_" + result.cat;
    if (result.checked === false) {
      this.excludeList.push(temp)
    } else {
      this.excludeList = this.excludeList.filter(item => item !== temp)
    }
    this.createAltQuery(result.dataset);
    this.filterData(result.dataset);
  }

  createAltQuery(dataset) {
    if (!this.checkBoxObj[dataset]) {
      this.checkBoxObj[dataset] = {}
    }
    for (let mainCat in this.checkBoxObj[dataset]) {
      let newQueryString = '';
      for (let cat in this.checkBoxObj[dataset]) {
        if (this.checkBoxObj[dataset][cat].length > 0 && cat !== mainCat) {
          let temp = "(" + this.checkBoxObj[dataset][cat].join(' OR ') + ")"
          if (newQueryString.length > 0) {
            newQueryString += " AND " + temp;
          } else {
            newQueryString += temp;
          }
        }
      }
      //add query from range here before passing it on to updateFacet
      let rangeQuery = '';
      let missingRangeQuery = '';
      for (let cat in this.sliderStorage[dataset]) {

        let data = this.sliderStorage[dataset][cat]
        let temp = `${cat}:[${data["low"]} TO ${data["high"]}]`;
        if (rangeQuery.length > 0) {
          rangeQuery += " AND " + temp;
        } else {
          rangeQuery += temp;
        }
        let temp2 = dataset + "_" + cat;
        if (!this.excludeList.includes(temp2)) {
          //Need to add conditional on if checked box marked
          if (missingRangeQuery.length === 0) {
            missingRangeQuery += `(* -${cat}:*)`
          } else {
            missingRangeQuery += ` OR (* -${cat}:*)`
          }
        }
      }

      rangeQuery = (missingRangeQuery.length === 0) ? `(${rangeQuery})` : `(${rangeQuery}) OR (${missingRangeQuery})`;
      this.searchQueryResults = (newQueryString.length > 0) ? `${newQueryString} AND ${rangeQuery}` : rangeQuery;

      let tempQuery = this.searchQueryResults.length === 0 ? '*' : this.searchQueryResults;
      let query = `${this.API_URL}/public-datasets/query/${dataset}/?q=${tempQuery}&facet=true`;
      query += "&facet.field=" + mainCat;

      if (!this.altStorage[dataset][mainCat]) {
        this.altStorage[dataset][mainCat] = {};
      }
      this.altStorage[dataset][mainCat]["altQuery"] = query;
    }

    for (let cat in this.altStorage[dataset]) {
      this.isLoading = true;
      let query = this.altStorage[dataset][cat]['altQuery'];
      if (query.length > 0) {
        this.getQueryResults(query)
          .subscribe(res => {
            this.facetField = res['facet_counts']['facet_fields'];
            for (let subcat in this.facetField) {
              let arr = this.facetField[cat];
              let temp = [];
              for (let i = 0; i < arr.length; i += 2) {
                let obj = {};
                obj[arr[i]] = arr[i + 1];
                temp.push(obj);
              }
              this.altStorage[dataset][cat]["data"] = temp;
            }
          })
      }
      this.isLoading = false;
    }
  }

  setSliderValue(value) {
    let dataset = value['dataset']
    let cat = value['category']
    this.sliderStorage[dataset][cat]['low'] = value['low'];
    this.sliderStorage[dataset][cat]['high'] = value['high'];
    this.filterData(dataset)
  }

  filterData(dataset) {
    let newQueryString = '';
    for (let cat in this.checkBoxObj[dataset]) {
      if (this.checkBoxObj[dataset][cat].length > 0) {
        let temp = "(" + this.checkBoxObj[dataset][cat].join(' OR ') + ")"
        if (newQueryString.length > 0) {
          newQueryString += " AND " + temp;
        } else {
          newQueryString += temp;
        }
      }
    }
    //add query from range here before passing it on to updateFacet
    let rangeQuery = '';
    for (let cat in this.sliderStorage[dataset]) {
      let data = this.sliderStorage[dataset][cat]
      let temp = `(${cat}:[${data["low"]} TO ${data["high"]}] OR (* -${cat}:*))`;
      if (rangeQuery.length > 0) {
        rangeQuery += " AND " + temp;
      } else {
        rangeQuery += temp;
      }
    }
    rangeQuery = `(${rangeQuery})`;

    this.searchQueryResults = (newQueryString.length > 0) ? `${newQueryString} AND ${rangeQuery}` : rangeQuery;

    let temp = this.addSearchQuery(this.currentDataset, this.searchQueryResults)
    this.updateFilterValues(temp, this.checkboxStatus[dataset], dataset, false)
  }

  onDisplayAdvance() {
    this.displayAdvance = !this.displayAdvance;
  }

  setDataset(datasetTag: string) {
    this.currentDataset = datasetTag;
  }

  backToBrowse() {
    this.currentDataset = '';
    this.searchQueryResults = '';
    this.isLoading = false;

    //reset storage to default
    for (let dataset in this.sliderStorage) {
      for (let cat in this.sliderStorage[dataset]) {
        this.sliderStorage[dataset][cat]["low"] = this.sliderStorage[dataset][cat]["floor"];
        this.sliderStorage[dataset][cat]["high"] = this.sliderStorage[dataset][cat]["ceil"];
      }
    }
    //reset checkbox values to false
    for (let dataset in this.checkboxStatus) {
      for (let cat in this.checkboxStatus[dataset]) {
        for (let subcat in this.checkboxStatus[dataset][cat]) {
          if (this.checkboxStatus[dataset][cat][subcat] === true) {
            this.checkboxStatus[dataset][cat][subcat] === false;
          }
        }
      }
    }
    this.checkBoxObj = {};
    this.altStorage = {};
    this.mainQuery = '*';
  }
}
