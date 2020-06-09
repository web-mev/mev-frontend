// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable } from 'rxjs';
// import { File } from '@app/features/file-manager/models/file';
// import { environment} from '@environments/environment';
//
// @Injectable({
//   providedIn: 'root'
// })
// export class FileManagerApiService {
//   readonly API = environment.apiUrl + '/resources';
//
//   constructor(private http: HttpClient) { }
//
//   getFiles(): Observable<any> {
//     return this.http.get(this.API);
//   }
//
//   createFile(file: File): Observable<any> {
//     return this.http.post(this.API, file);
//   }
//
//   updateFile(file: File): Observable<any> {
//     return this.http.put(`${this.API}/${file.id}`, file);
//   }
// }

import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { File } from '@app/features/file-manager/models/file';

@Injectable({
  providedIn: 'root'
})
export class FileManagerApiService {
  private readonly baseUrl = environment.apiUrl + '/resources';
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
  createFile(file: File): Observable<any> {
    return this.http
      .post<any>(`${this.baseUrl}`, JSON.stringify(file), this.httpOptions)
      .pipe(retry(1), catchError(this.handleError));
  }

  // GET
  getFile(id: string | number): Observable<any> {
    return this.http
      .get<any>(`${this.baseUrl}/${id}`)
      .pipe(retry(1), catchError(this.handleError));
  }

  // GET
  getFiles(): Observable<any> {
    return this.http
      .get<any[]>(this.baseUrl)
      .pipe(retry(1), catchError(this.handleError));
  }

  // PUT
  updateFile(id: string | number, file: File): Observable<any> {
    return this.http
      .put<any>(`${this.baseUrl}/${id}`, JSON.stringify(file), this.httpOptions)
      .pipe(retry(1), catchError(this.handleError));
  }

  // DELETE
  deleteFile(id: string | number) {
    return this.http
      .delete<any>(`${this.baseUrl}/${id}`, this.httpOptions)
      .pipe(retry(1), catchError(this.handleError));
  }
}
