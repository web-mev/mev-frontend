import {Injectable} from '@angular/core';

import {BehaviorSubject, Observable, throwError} from 'rxjs';
import {catchError, map, retry, tap} from 'rxjs/operators';
import {ApiService} from '@app/_services/api.service';
import {User} from '@app/_models/user';
import {HttpClient, HttpErrorResponse, HttpHeaders} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private currentUserSubject: BehaviorSubject<User>;
  public currentUser: Observable<User>;

  private readonly JWT_TOKEN = 'JWT_TOKEN';
  private readonly REFRESH_TOKEN = 'REFRESH_TOKEN';

  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private api: ApiService, private http: HttpClient) {
    this.currentUserSubject = new BehaviorSubject<User>(
      JSON.parse(localStorage.getItem(this.JWT_TOKEN))
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  handleError(error: HttpErrorResponse) {
    let errorMessage = 'Unknown error';

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

  public get currentUserValue(): User {
    return this.currentUserSubject.value;
  }


  login(username: string, password: string) {

    return this.api.post('token', {email: username, password: password})
      .pipe(
        map(user => {
          // login successful if there's a token in the response: {'refresh': '<REFRESH TOKEN>', 'access': '<ACCESS_TOKEN>'}
          if (user && user.access) {
            this.storeJwtToken(JSON.stringify(user.access));
            this.storeRefreshToken(JSON.stringify(user.refresh));
            this.currentUserSubject.next(user);
          }
          return user;
        })
      )
  }

  // store user details and token in local storage to keep user logged in between page refreshes
  private storeJwtToken(jwt: string) {
    localStorage.setItem(this.JWT_TOKEN, jwt);
  }

  private storeRefreshToken(token: string) {
    localStorage.setItem(this.REFRESH_TOKEN, token);
  }

  logout() {
    // remove user from local storage to log user out
    localStorage.removeItem(this.JWT_TOKEN);
    this.currentUserSubject.next(null);
  }

  getJwtToken():string {
    return JSON.parse(localStorage.getItem(this.JWT_TOKEN));
  }

  private getRefreshToken() {
    return JSON.parse(localStorage.getItem(this.REFRESH_TOKEN));
  }

  isLoggedIn() {
    return this.getJwtToken() !== null;
  }

  refreshToken() {
    return this.api.post('token/refresh', {
      'refresh': this.getRefreshToken()
    }).pipe(tap((tokens) => {
       this.storeJwtToken(JSON.stringify(tokens.access));
    }));
  }
}
