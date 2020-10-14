import { TestBed } from '@angular/core/testing';

import { SsnStorageService } from './ssn-storage.service';

describe('SsnStorageService', () => {
  let service: SsnStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SsnStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
