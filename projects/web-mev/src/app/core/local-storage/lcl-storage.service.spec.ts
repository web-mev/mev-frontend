import { TestBed } from '@angular/core/testing';

import { LclStorageService } from './lcl-storage.service';

describe('LclStorageService', () => {
  let service: LclStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LclStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
