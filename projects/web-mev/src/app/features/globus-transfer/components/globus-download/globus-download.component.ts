import { Component, Inject, Input } from '@angular/core';
import { DOCUMENT } from '@angular/common';

import { LclStorageService } from '@app/core/local-storage/lcl-storage.service';
import { GlobusService } from '@app/features/globus-transfer/services/globus';

import { authInit } from '../../globus_common';

@Component({
  selector: 'globus-download',
  templateUrl: './globus-download.component.html',
  styleUrls: ['./globus-download.component.css']
})
export class GlobusDownloadComponent {

  @Input() resource_pk: string;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private storage: LclStorageService,
    public globusService: GlobusService
  ){}

  // orchestrates the initial authentication and redirect to
  // the Globus file browser
  downloadInit() {
    this.storage.set('resource_pk', this.resource_pk);
    authInit(this.globusService, this.storage, 'download').subscribe(
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