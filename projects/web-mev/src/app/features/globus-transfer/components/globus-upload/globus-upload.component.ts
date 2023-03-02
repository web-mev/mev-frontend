import { Component, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

import { LclStorageService } from '@app/core/local-storage/lcl-storage.service';
import { GlobusService } from '@app/features/globus-transfer/services/globus';

import { authInit } from '../../globus_common';

@Component({
  selector: 'globus-upload',
  templateUrl: './globus-upload.component.html',
  styleUrls: ['./globus-upload.component.css']
})
export class GlobusUploadComponent {

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private storage: LclStorageService,
    public globusService: GlobusService
  ){}

  // orchestrates the initial authentication and redirect to
  // the Globus file browser
  uploadInit() {
    authInit(this.globusService, this.storage, 'upload').subscribe(
      url => {
        if(url.length > 0){
          this.document.location.href = url;
        } else {
          console.log('Did not receive a url to act upon');
        }
      }
    );
    
  }
}