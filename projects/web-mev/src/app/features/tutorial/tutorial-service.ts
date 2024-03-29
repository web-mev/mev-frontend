import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';


/**
 * Used for adding the tutorial files to the user's files
 */
@Injectable({
  providedIn: 'root'
})
export class TutorialService {
  private readonly API_URL = environment.apiUrl;

  constructor(
    private httpClient: HttpClient,
  ) {}

  /**
   * Add file, post method for Dropbox upload
   *
   */
  addTutorialFile(payload: any): Observable<any> {
    return this.httpClient
      .post(`${this.API_URL}/resources/add-bucket-resources/`, payload)
  }
}
