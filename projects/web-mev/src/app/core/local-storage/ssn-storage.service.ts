import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';

/**
 * Session storage service
 * used for persist application data in observable key value pair
 */
@Injectable({
  providedIn: 'root'
})
export class SsnStorageService extends StorageService {
  constructor() {
    super(sessionStorage);
  }
}
