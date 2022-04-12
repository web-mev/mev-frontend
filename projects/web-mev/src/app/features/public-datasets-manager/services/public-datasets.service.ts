import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { PublicDataset, PublicDatasetAdapter } from '../models/public-dataset';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PublicDatasetService {
  private readonly API_URL = environment.apiUrl + '/public-datasets/';

  
  constructor(
    private httpClient: HttpClient,
    private adapter: PublicDatasetAdapter
  ) {}

  getPublicDatasets(): Observable<PublicDataset[]>{
    
    return <Observable<PublicDataset[]>>(this.httpClient
      .get(this.API_URL)
      .pipe(
        map((data: any[]) => data.map(item => this.adapter.adapt(item)))
      )
    );
  }

  getPublicDatasetDetails(datasetTag: string): Observable<PublicDataset>{
    let url = this.API_URL + datasetTag;
    return <Observable<PublicDataset>>(this.httpClient
      .get(url)
      .pipe(
        map((data: any) =>  this.adapter.adapt(data))
      )
    );
  }

  makeSolrQuery(url_suffix: string): Observable<any> {
    let url = this.API_URL + 'query/' + url_suffix;
    return this.httpClient.get(url)
  }

  createDataset(datasetTag: string, payload: any): Observable<any>{
    
    let url = this.API_URL + `create/${datasetTag}/`;
    console.log("in create: ", url, payload)
    return <Observable<any>>(
      this.httpClient.post(
        url,
        payload
      )
    );
  }
}
