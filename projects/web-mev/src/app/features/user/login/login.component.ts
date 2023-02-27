import { Component, OnInit, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { LclStorageService } from '@app/core/local-storage/lcl-storage.service';
import { AuthenticationService } from '@app/core/authentication/authentication.service';
import { UserService } from '@app/core/user/user.service';
import { NotificationService } from '@core/core.module';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { ROUTE_ANIMATIONS_ELEMENTS } from '@core/core.module';

/**
 * Login Component
 *
 * Support sign-in with email/password and Google sign-in
 */

@Component({
  selector: 'mev-login-form',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  routeAnimationsElements = ROUTE_ANIMATIONS_ELEMENTS;

  loginForm: FormGroup;
  loading = false;
  submitted = false;
  returnUrl: string;

  isUserActivated = null;
  token: string;
  uid: string;

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authenticationService: AuthenticationService,
    private userService: UserService,
    private readonly notificationService: NotificationService,
    @Inject(DOCUMENT) private document: Document,
    private storage: LclStorageService
  ) {
    // redirect to home if already logged in
    if (this.authenticationService.currentUserValue) {
      this.router.navigate(['/workarea']);
    }

    // if uid and token exist, activate a new account
    this.route.params.subscribe(params => {
      if (params.token && params.uid) {
        this.token = params.token;
        this.uid = params.uid;
        this.activateUser();
      }
    });

  }

  activateUser() {
    this.isUserActivated = true;
    this.userService.activate({ token: this.token, uid: this.uid }).subscribe(
      data => {
        this.isUserActivated = true;
      },
      err => {
        this.isUserActivated = false;
      }
    );
  }

  /**
   * Initialize login form
   */

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', Validators.required],
      password: ['', Validators.required]
    });

    // get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  /**
   * Convenience getter for easy access to form fields
   */

  get f() {
    return this.loginForm.controls;
  }

  onSubmit() {
    this.submitted = true;

    // stop here if form is invalid
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;

    this.authenticationService
      .login(this.f.email.value, this.f.password.value)
      .subscribe(
        data => {
          this.router.navigate([this.returnUrl]);
        },
        error => {
          if (error.status == 401 || error.status == 400) {
            this.notificationService.error(`Error ${error.status}: Wrong Email or Password. Try again or click Forgot Password to reset it.`);
          }
          this.loading = false;
        }
      );
  }

  startGoogleAuth(): void {
    console.log('Start alternate google auth...');
    this.authenticationService.startOAuth2Flow('google-oauth2').subscribe(
      response => {
        console.log(response);

        let url = '';
        // if the user has not previously authenticated
        // with Globus (and the backend does not have Globus
        // tokens), then the backend will return a url to the
        // Globus authentication page
        if ('url' in response){

          // part of the OAuth2 spec includes a 'state'
          // parameter, which is part of the url params
          // returned by the backend. We cache this in
          // local browser storage so that we can later
          // compare it with the response from the Globus
          // auth server
          url = response['url'];
          let params = url.split("?")[1].split("&");
          let paramObj = {};
          for(let p of params){
            let kvp_array = p.split("=");
            paramObj[kvp_array[0]] = kvp_array[1];
          }
          this.storage.set('google-oauth2-state', paramObj['state']);
        } else {
          console.log('Unexpected response from backend.');
          return;
        }
        this.document.location.href = url;
      }
    );
  }
}
