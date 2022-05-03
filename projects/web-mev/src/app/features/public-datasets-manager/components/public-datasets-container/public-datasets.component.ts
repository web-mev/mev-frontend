import { Component, OnInit, OnChanges, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
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

  filterItems = {
    gender: {
      "male": 10,
      "female": 20,
    },
    ethnicity: {
      "not hispanic or latino": 0,
      "hispanic or latino": 0,
    },
    race: {
      "white": 0,
      "black or african american": 0,
      "asian": 0,
      "other": 0,
      "Unknown": 0
    },
    vital_status:{
      "Dead": 0,
      "Alive": 0
    },
    age_at_diagnosis:{
      "0-10": 0,
      "10-30": 0,
      "30-60": 0,
      "60+": 0
    },
    cog_renal_stage:{
      "Stage I": 0,
      "Stage II": 0,
      "Stage III": 0,
      "Stage IV": 0,
      "Stage V": 0
    },
    days_to_last_follow_up: {
      "0-50": 0,
      "50-100": 0,
      "100-200": 0,
      "200+": 0
    },
    inss_stage: {
      "Stage 1": 0,
      "Stage 2": 0,
      "Stage 3": 0,
      "Stage 4": 0,
      "Stage 5": 0
    },
    last_known_disease_status: {
      "not reported": 0,
      "Unknown tumor status": 0,
    }

  }

  constructor(fb: FormBuilder, private httpClient: HttpClient, private ref: ChangeDetectorRef) {
    this.target = fb.group({
      "male": false,
      "female": false,
      "not hispanic or latino": false,
      "hispanic or latino": false,
      "white": false,
      "black or african american": false,
      "asian": false,
      "other": false,
      "unknown": false,
      "Dead": false,
      "Alive": false,
    });
  }


  ngOnInit(): void {
    this.isLoading = true;
    this.addToQuery(this.filterItems, 'target-rnaseq');
    console.log("on init: ", this.filterItems)
    
  }

  setDataset(datasetTag: string) {
    console.log('Set dataset to ' + datasetTag);
    this.currentDataset = datasetTag;
  }

  backToBrowse() {
    this.currentDataset = '';
  }

  addToQuery(searchItem, dataset) {
    for (let cat in searchItem) {
      for (let i in searchItem[cat]) {
        this.getResults(cat, i, dataset)
          .subscribe(res => {
            this.filterItems[cat][i] = res['response']['numFound'];
          })
      }
      this.isLoading = false;
    }
    console.log("filter logs: ", this.filterItems)
    
    // this.ref.markForCheck();
    
  }

  getResults(category, item, dataset) {
    let query = `${this.API_URL}/public-datasets/query/${dataset}/?q=${category}:"${item}"`;
    console.log("query:", query )
    return this.httpClient.get(query)
  }

}
