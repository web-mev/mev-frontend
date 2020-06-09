import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { User } from '@app/_models/user';
import { ApiService } from '@app/_services/api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private api: ApiService) {}

  get(id: number): Observable<User> {
    return this.api.get('users', id);
  }

  getAll(): Observable<User[]> {
    return this.api.get_all('users');
  }

  register(user: User) {
    return this.api.post('users', user);
  }

  update(user: User, id: number) {
    return this.api.update('users', id, user);
  }

  delete(id: number) {
    return this.api.delete('users', id);
  }
}
