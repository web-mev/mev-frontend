import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { User } from '@app/_models/user';
import { Observable, BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';

/**
 * User service
 *
 */
@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly API_URL = environment.apiUrl;
  private currentUserEmailSubject: BehaviorSubject<string>;
  public currentUserEmail: Observable<string>;

  constructor(private http: HttpClient) {
    this.currentUserEmailSubject = new BehaviorSubject<string>('');
    this.currentUserEmail = this.currentUserEmailSubject.asObservable();
  }

  get(id: number): Observable<User> {
    return this.http.get<any>(`${this.API_URL}/users/${id}/`);
  }

  getAll(): Observable<User[]> {
    return this.http.get<any[]>(`${this.API_URL}/users/`);
  }

  register(body): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/users/register/`, body);
  }

  activate(body): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/users/activate/`, body);
  }

  changePassword(body): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/users/change-password/`, body);
  }

  update(user: User, id: number) {
    return this.http.put<any>(
      `${this.API_URL}/users/${id}/`,
      JSON.stringify(user)
    );
  }

  delete(id: number) {
    return this.http.delete<any>(`${this.API_URL}/users/${id}/`);
  }

  /**
   * Queries the backend for the current user and 
   * puts the email address into the appropriate
   * BehaviorSubject so that other components are notified
   * of the change.
   */
  getCurrentUserEmail(): void{
    this.getAll().subscribe(
      allUsers => {
        let user = allUsers[0];
        this.currentUserEmailSubject.next(user['email']);
      }
    );
  }
  
}
