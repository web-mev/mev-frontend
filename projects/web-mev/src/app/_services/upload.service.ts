import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpEvent,
  HttpErrorResponse,
  HttpEventType
} from '@angular/common/http';
import { map } from 'rxjs/operators';
import { ApiService } from '@app/_services/api.service';

import { consoleTestResultsHandler } from 'tslint/lib/test';

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  constructor(private api: ApiService) {}

  public upload(formData) {
    return this.api.post('resources', formData);
  }
}
