import { Component, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

import { LclStorageService } from '@app/core/local-storage/lcl-storage.service';

import { GlobusService } from '@app/features/globus-transfer/services/globus';

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
    this.globusService.initGlobusUpload().subscribe(
      x => {
        let url = '';
        // if the user has not previously authenticated
        // with Globus (and the backend does not have Globus
        // tokens), then the backend will return a url to the
        // Globus authentication page
        if ('globus-auth-url' in x){

          // part of the OAuth2 spec includes a 'state'
          // parameter, which is part of the url params
          // returned by the backend. We cache this in
          // local browser storage so that we can later
          // compare it with the response from the Globus
          // auth server
          url = x['globus-auth-url'];
          let params = url.split("?")[1].split("&");
          let paramObj = {};
          for(let p of params){
            let kvp_array = p.split("=");
            paramObj[kvp_array[0]] = kvp_array[1];
          }
          this.storage.set('globus-state', paramObj['state']);
          this.storage.set('globus-direction', 'upload');
        } else if ('globus-browser-url' in x){
          // if the user has Globus tokens on the backend, the backend
          // will return a link to the Globus file browser
          url = x['globus-browser-url'];
        } else {
          console.log('Unexpected response from backend.');
          return;
        }
        this.document.location.href = url;
      }
    );
  }
}