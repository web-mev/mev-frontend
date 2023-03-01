import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { User } from '@app/_models/user';
import { HttpClient } from '@angular/common/http';

/**
 * Authentication service
 *
 * Used for user registration and authentication
 */

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private currentUserSubject: BehaviorSubject<User>;
  public currentUser: Observable<User>;
  private readonly API_URL = environment.apiUrl;
  private readonly API_NAME = environment.appName;

  private readonly JWT_TOKEN = this.API_NAME + 'JWT_TOKEN';
  private readonly REFRESH_TOKEN = this.API_NAME + 'REFRESH_TOKEN';

  constructor(private http: HttpClient) {
    this.currentUserSubject = new BehaviorSubject<User>(
      JSON.parse(sessionStorage.getItem(this.JWT_TOKEN))
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User {
    return this.currentUserSubject.value;
  }

  /**
   * User login
   *
   */
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
    sessionStorage.setItem(this.JWT_TOKEN, jwt);
  }

  /**
   * Update refresh token in storage
   *
   */
  private storeRefreshToken(token: string) {
    sessionStorage.setItem(this.REFRESH_TOKEN, token);
  }

  /**
   * User logout
   *
   */
  logout() {
    // remove user from local storage to log user out
    sessionStorage.removeItem(this.JWT_TOKEN);
    this.currentUserSubject.next(null);
  }

  /**
   * Get user token from storage
   *
   */
  getJwtToken(): string {
    return JSON.parse(sessionStorage.getItem(this.JWT_TOKEN));
  }

  /**
   * Get user refresh token from storage
   *
   */
  private getRefreshToken() {
    return JSON.parse(sessionStorage.getItem(this.REFRESH_TOKEN));
  }

  /**
   * Check if user is logged in
   *
   */
  isLoggedIn() {
    return this.getJwtToken() !== null;
  }

  /**
   * Refresh token
   *
   */

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

  /**
   * This starts the OAuth2 flow. The webmev backend will respond with
   * an auth url to the oauth2 provider. Often, subscribers of this will
   * cache the canonical 'state' parameter so that it can be compared
   * to the value returned following approval by the user
   */
  startOAuth2Flow(authProvider: string): Observable<any> {
    return this.http.get(`${this.API_URL}/users/social/${authProvider}/`);
  }

  /**
   * This sends the oauth2 'code' to the webmev backend. There, oauth2
   * client libraries will use that in combination with the client id/secret
   * to get a token for the particular oauth2 provider. Then, the webmev
   * backend will create a webmev JWT pair and return those. 
   */
  sendCode(provider: string, code: string, state: string, scope: string): Observable<any> {
    console.log(`in send code with provider=${provider}`);
    let protocol = window.location.protocol;
    let host = window.location.host; 
    return this.http.post(
      `${this.API_URL}/login/social/jwt-pair/`,
      {
        'provider': provider,
        'code': code, 
        'redirect_uri': `${protocol}//${host}/oauth2-redirect/${provider}/`
      }
    ).pipe(
      tap(
        token_obj => {
          // login successful if there's a token in the response: 
          // {'refresh': '<REFRESH TOKEN>', 'token': '<ACCESS_TOKEN>'}
          // Note that email + password logins return tokens with keys
          // of 'refresh' and 'access'. Since the backend uses a 
          // libraries to create both of those tokens, we have to 
          // manipulate them to the frontend's expectation below
          // (e.g. keys of refresh and access)
          if (token_obj && token_obj.token) {
            this.storeJwtToken(JSON.stringify(token_obj.token));
            this.storeRefreshToken(JSON.stringify(token_obj.refresh));
            let t = Object()
            t.access = token_obj.token;
            t.refresh = token_obj.refresh
            this.currentUserSubject.next(t);
          }
        }
      )
    );
  }

  /**
   * Request password reset
   *
   */

  requestPasswordReset(body): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/users/reset-password/`, body);
  }

  /**
   * Confirm password reset
   *
   */
  confirmPasswordReset(body): Observable<any> {
    // user has clicked on a reset link and is sending a UID (encoded), a token, a new password, and a re-typed confirmation of that password
    return this.http.post<any>(
      `${this.API_URL}/users/reset-password/confirm/`,
      body
    );
  }

  /**
   * Update password
   *
   */
  newPassword(body): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/users/change-password/`, body);
  }

  /**
   * Verify token after password reset
   *
   */
  ValidPasswordToken(body): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/users/activate/`, body);
  }
}
