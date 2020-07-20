import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, count, switchMap, catchError, retry } from 'rxjs/operators';
import { User } from '@app/_models/user';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private currentUserSubject: BehaviorSubject<User>;
  public currentUser: Observable<User>;
  private readonly API_URL = environment.apiUrl;
  private readonly JWT_TOKEN = 'JWT_TOKEN';
  private readonly REFRESH_TOKEN = 'REFRESH_TOKEN';

  constructor(private http: HttpClient) {
    this.currentUserSubject = new BehaviorSubject<User>(
      JSON.parse(localStorage.getItem(this.JWT_TOKEN))
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User {
    return this.currentUserSubject.value;
  }

  login(username: string, password: string) {
    return this.http
      .post<any>(`${this.API_URL}/token/`, {
        email: username,
        password: password
      })
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
      );
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

  getJwtToken(): string {
    return JSON.parse(localStorage.getItem(this.JWT_TOKEN));
  }

  private getRefreshToken() {
    return JSON.parse(localStorage.getItem(this.REFRESH_TOKEN));
  }

  isLoggedIn() {
    return this.getJwtToken() !== null;
  }

  refreshToken() {
    return this.http
      .post<any>(`${this.API_URL}/token/refresh/`, {
        refresh: this.getRefreshToken()
      })
      .pipe(
        tap(tokens => {
          this.storeJwtToken(JSON.stringify(tokens.access));
        })
      );
  }

  googleSignInExternal(googleTokenId: string): Observable<any> {
    return this.http
      .post<any>(`${this.API_URL}/users/social/google/`, {
        provider_token: googleTokenId
      })
      .pipe(
        map(token => {
          // login successful if there's a token in the response: {'refresh': '<REFRESH TOKEN>', 'access': '<ACCESS_TOKEN>'}
          if (token && token.access) {
            this.storeJwtToken(JSON.stringify(token.access));
            this.storeRefreshToken(JSON.stringify(token.refresh));
            this.currentUserSubject.next(token);
          }
          return token;
        })
      );
  }

  requestPasswordReset(body): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/users/reset-password/`, body);
  }

  confirmPasswordReset(body): Observable<any> {
    // user has clicked on a reset link and is sending a UID (encoded), a token, a new password, and a re-typed confirmation of that password
    return this.http.post<any>(
      `${this.API_URL}/users/reset-password/confirm/`,
      body
    );
  }

  newPassword(body): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/users/change-password/`, body);
  }

  ValidPasswordToken(body): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/users/activate/`, body);
  }

  // googleSignInExternal(googleTokenId: string): Observable<any> {
  //
  //   return this.http.get(APISecurityRoutes.authRoutes.googlesigninexternal(), {
  //     params: new HttpParams().set('googleTokenId', googleTokenId)
  //   })
  //     .pipe(
  //       map((result) => {
  //         if (result) { //if (!(result instanceof SimpleError)) {
  //           //this.credentialsService.setCredentials(result, true);
  //         }
  //         return result;
  //
  //       }),
  //       catchError(() => of(new Error('error_signin')))
  //     );
  //
  // }
}
