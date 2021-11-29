import { TestBed } from '@angular/core/testing';

import { PublicDatasetService } from './public-datasets.service';

describe('PublicDatasetService', () => {
  let service: PublicDatasetService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PublicDatasetService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
