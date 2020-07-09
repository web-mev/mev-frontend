import { TestBed } from '@angular/core/testing';

import { WorkspaceDetailService } from './workspace-detail.service';

describe('WorkspaceDetailService', () => {
  let service: WorkspaceDetailService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WorkspaceDetailService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
