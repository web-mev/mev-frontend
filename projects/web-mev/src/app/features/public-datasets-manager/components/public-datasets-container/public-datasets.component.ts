import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { T } from '@angular/cdk/keycodes';

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
  isLoading = false;

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


  constructor(fb: FormBuilder, private httpClient: HttpClient, private ref: ChangeDetectorRef) { }

  ngOnInit(): void { }

  afterLoaded() {
    for (let dataset in this.filterFields) {
      this.createRangeDataStorage(dataset);
      //builds the initial query string
      this.queryStringForFilters = this.getFacetFieldQueryString(dataset);

      this.createAltQuery(dataset)

      if (!this.storageDataSet[dataset]) {
        this.storageDataSet[dataset] = {}
      }
      if (!this.checkboxStatus[dataset]) {
        this.checkboxStatus[dataset] = {}
      }
      //gets the numbers for each category
      this.updateFilterValues(this.queryStringForFilters, this.storageDataSet[dataset], this.checkboxStatus[dataset], dataset, true);
    }
  }


  createRangeDataStorage(dataset) {
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

  getFacetFieldQueryString(dataset) {
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

  addQuerySearchString(dataset, filterItems) {
    let categoryArrayRange = this.filterRangeFields[dataset]
    let rangeQuery = '';
    let missingRangeQuery = '';
    for (let k = 0; k < categoryArrayRange.length; k++) {
      let category = categoryArrayRange[k];
      let low = this.sliderStorage[dataset][category]['low'];
      let high = this.sliderStorage[dataset][category]['high'];
      rangeQuery += `&facet.query={!tag=q1}${category}:[${low} TO ${high}]`
      // if (missingRangeQuery.length === 0) {
      //   missingRangeQuery += `(* -${category}:*)`
      // } else {
      //   missingRangeQuery += ` OR (* -${category}:*)`
      // }
      missingRangeQuery += (missingRangeQuery.length === 0) ? `(* -${category}:*)` : ` OR (* -${category}:*)`
    }

    let categoryArray = this.filterFields[dataset]
    let tempQuery = filterItems.length === 0 ? missingRangeQuery : `${filterItems} OR ${missingRangeQuery}`;
    let query = `${this.API_URL}/public-datasets/query/${dataset}/?q=${tempQuery}&facet=true`;

    for (let i = 0; i < categoryArray.length; i++) {
      query += "&facet.field=" + categoryArray[i];
    }

    query += rangeQuery;
    return query;
  }

  getQueryResults(queryString) {
    return this.httpClient.get(queryString)
  }

  updateFilterValues(query, saveTo, checkboxStatus, dataset, initializeCheckbox) {
    console.log("update filter val: ", query)
    console.log("slider storage: ", this.sliderStorage[dataset])
    this.getQueryResults(query)
      .subscribe(res => {
        this.facetField = res['facet_counts']['facet_fields'];
        for (let cat in this.facetField) {
          let arr = this.facetField[cat]

          let obj2 = {}; //this is for checkbox status
          saveTo[cat] = [];
          for (let i = 0; i < arr.length; i += 2) {
            let obj = {};
            obj[arr[i]] = arr[i + 1];

            if (initializeCheckbox) {
              obj2[arr[i]] = false;
            }

            //if it does exist, look for that id and replace, else just add it
            saveTo[cat].push(obj); //the change here saveTo[cat] = obj
            if (initializeCheckbox) {
              checkboxStatus[cat] = obj2;
            }
            if (!this.altStorage[dataset]) {
              this.altStorage[dataset] = {}
            }
            if (!this.altStorage[dataset][cat]) {
              this.altStorage[dataset][cat] = {
                "altQuery": '',
                "data": []
              };
            }
            if (this.altStorage[dataset][cat]["altQuery"].length === 0) {
              this.altStorage[dataset][cat]["data"].push(obj);
            }

          }
        }
        //for the range queries only
        let facet_queries = res["facet_counts"]["facet_queries"];
        for (let item in facet_queries) {
          let indexOfColon = item.indexOf(':')
          let cat = item.slice(9, indexOfColon)
          let count = res["facet_counts"]['facet_queries'][item];
          console.log("range count: ", res["facet_counts"]['facet_queries'][item], item, cat)
          this.sliderStorage[dataset][cat]['count'] = count;
        }
      })
  }

  onChecked(currResult, cat, subcat, dataset) {
    if (!this.checkBoxObj[dataset]) {
      this.checkBoxObj[dataset] = {};
    }
    let newQueryItem = `${cat}:"${subcat}"`;
    if (currResult === true) {
      if (!this.checkBoxObj[dataset][cat]) {
        this.checkBoxObj[dataset][cat] = [];
      }
      this.checkBoxObj[dataset][cat].push(newQueryItem);
      this.checkboxStatus[dataset][cat][subcat] = true;

    } else if (currResult === false) {
      this.checkBoxObj[dataset][cat] = this.checkBoxObj[dataset][cat].filter(item => item !== newQueryItem);
      this.checkboxStatus[dataset][cat][subcat] = false
    }
    this.createAltQuery(dataset);
    this.filterData(dataset);
  }



  onExcludeNotReported(result) {
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
        console.log("alt query: ", query)
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
      let temp = `${cat}:[${data["low"]} TO ${data["high"]}]`;
      if (rangeQuery.length > 0) {
        rangeQuery += " AND " + temp;
      } else {
        rangeQuery += temp;
      }
    }
    rangeQuery = `(${rangeQuery})`;

    this.searchQueryResults = (newQueryString.length > 0) ? `${newQueryString} AND ${rangeQuery}` : rangeQuery;

    let temp = this.addQuerySearchString(this.currentDataset, this.searchQueryResults)
    this.updateFilterValues(temp, this.storageDataSet[this.currentDataset], this.checkboxStatus[dataset], dataset, false)
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
  }
}
