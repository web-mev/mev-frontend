
import { Component, OnInit, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { switchMap } from 'rxjs/operators';

import { AuthenticationService } from '@app/core/authentication/authentication.service';
import { LclStorageService } from '@app/core/local-storage/lcl-storage.service';
import { UserService } from '@app/core/user/user.service';

@Component({
  selector: 'auth-redirect',
  templateUrl: './auth-redirect.component.html',
  styleUrls: ['./auth-redirect.component.scss']
})
export class AuthRedirectComponent implements OnInit {

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private authService: AuthenticationService,
    private userService: UserService,
    private storage: LclStorageService,
    @Inject(DOCUMENT) private document: Document,
  ) { }

  ngOnInit(): void {
    this.activatedRoute.queryParamMap.pipe(
      switchMap(
        data => {
          console.log('DATA');
          console.log(data);
          let code = data['params']['code'];
          let returnedState = data['params']['state'];
          let scope = data['params']['scope'];
          // check that the returned state matches the original
          let original_state = this.storage.get('google-oauth2-state');
          if (original_state === returnedState) {
            return this.authService.sendCode(code, returnedState, scope);
          } else {
            console.log('state did not match');
          }
        }
      )
    ).subscribe(
      x => {
        console.log('about to redirect...');
        this.userService.getCurrentUserEmail();
        this.router.navigate(['/workarea']);

      }
    );
  }
}
