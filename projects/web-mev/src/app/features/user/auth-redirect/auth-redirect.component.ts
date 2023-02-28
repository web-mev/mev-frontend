
import { Component, OnInit, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { AuthenticationService } from '@app/core/authentication/authentication.service';
import { LclStorageService } from '@app/core/local-storage/lcl-storage.service';
import { UserService } from '@app/core/user/user.service';
import { NotificationService } from '@app/core/core.module';

@Component({
  selector: 'auth-redirect',
  templateUrl: './auth-redirect.component.html',
  styleUrls: ['./auth-redirect.component.scss']
})
export class AuthRedirectComponent implements OnInit {

  oauth2_provider: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private authService: AuthenticationService,
    private userService: UserService,
    private storage: LclStorageService,
    private notificationService: NotificationService,
    @Inject(DOCUMENT) private document: Document,
  ) { }

  ngOnInit(): void {

    // we can use this redirect url for multiple oauth2
    // providers if necessary. Figure out which one we are 
    // working with and then check the query params after that.
    this.activatedRoute.params.subscribe(
      params => {
        this.oauth2_provider = params.oauth2_provider;
        this.exchangeCode();
      }
    );

  }

  exchangeCode() {
    this.activatedRoute.queryParamMap.pipe(
      switchMap(
        data => {
          // these are canonical query params that are 
          // returned from any oauth2 provider:
          let code = data['params']['code'];
          let returnedState = data['params']['state'];
          let scope = data['params']['scope'];

          // check that the returned state matches the original
          let stateParamName = `${this.oauth2_provider}-state`;
          let originalState = this.storage.get(stateParamName);
          if (originalState === returnedState) {
            return this.authService.sendCode(this.oauth2_provider, 
              code, returnedState, scope);
          } else {
            return throwError('state param wrong');
          }
        }
      )
    ).subscribe(
      x => {
        this.userService.getCurrentUserEmail();
        this.router.navigate(['/workarea']);

      },
      err => {
        this.notificationService.error('There was a problem with authentication. Please try again.');
        this.router.navigate(['/login']);
      }
    );
  }
}
