import { Component, OnInit, Inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DOCUMENT } from '@angular/common';

import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

import { LclStorageService } from '@app/core/local-storage/lcl-storage.service';
import { GlobusService } from '@app/features/globus-transfer/services/globus';


@Component({
  selector: 'globus-auth',
  templateUrl: './globus-auth.component.html'
})
export class GlobusAuthComponent implements OnInit {

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private activatedRoute: ActivatedRoute,
    private storage: LclStorageService,
    private globusService: GlobusService
  ) 
  { }

  ngOnInit(): void {

    this.activatedRoute.queryParamMap.pipe(
      switchMap(
        data => {
          let code = data['params']['code'];
          let state = data['params']['state'];
          console.log('code=' + code);
          let expectedState = this.storage.get('globus-state');
          if (expectedState === state){
            console.log('state parameter matched.');
            let direction = this.storage.get('globus-direction');
            return this.globusService.sendGlobusCode(code, direction);
          } else {
            console.log('State parameter did not match');
            return of('State parameter did not match');
          }
        }
      )
      ).subscribe(
        data => {
          console.log('Returned: ');
          console.log(data);
          let url = data['globus-browser-url'];
          this.document.location.href = url;
        }
      );
    }
}
