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
}
