import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl;
  httpOptions: Object = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    }),
    reportProgress: true,
    observe: 'events'
  };
  constructor(private http: HttpClient) {}

  handleError(error: HttpErrorResponse) {
    let errorMessage = 'Unknown error';
    console.log(error);
    if (error.error instanceof ErrorEvent) {
      // Client-side errors
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side errors
      errorMessage = `Server Side Error! Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.log(errorMessage);
    return throwError(errorMessage);
  }

  // POST
  post(url: string, data: Object): Observable<any> {
    return this.http
      .post<any>(
        `${this.baseUrl}/${url}/`,
        JSON.stringify(data),
        this.httpOptions
      )
      .pipe(retry(1), catchError(this.handleError));
  }

  // GET
  get(url: string, id: string | number): Observable<any> {
    return this.http
      .get<any>(`${this.baseUrl}/${url}/${id}`)
      .pipe(retry(1), catchError(this.handleError));
  }

  // GET
  get_all(url: string): Observable<any> {
    return this.http
      .get<any[]>(this.baseUrl + '/url/')
      .pipe(retry(1), catchError(this.handleError));
  }

  // PUT
  update(url: string, id: string | number, data: Object): Observable<any> {
    return this.http
      .put<any>(
        this.baseUrl + '/url/' + id,
        JSON.stringify(data),
        this.httpOptions
      )
      .pipe(retry(1), catchError(this.handleError));
  }

  // DELETE
  delete(url: string, id: string | number) {
    return this.http
      .delete<any>(this.baseUrl + '/url/' + id, this.httpOptions)
      .pipe(retry(1), catchError(this.handleError));
  }
}
