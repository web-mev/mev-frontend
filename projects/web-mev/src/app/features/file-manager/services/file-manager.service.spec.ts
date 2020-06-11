import { TestBed } from '@angular/core/testing';

import { FileService} from "@file-manager/services/file-manager.service";

describe('FileManagerService', () => {
  let service: FileService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FileService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
