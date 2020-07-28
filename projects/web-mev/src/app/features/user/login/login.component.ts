import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { AuthenticationService } from '@app/_services/authentication.service';
import { UserService } from '@app/_services/user.service';
import { NotificationService } from '@core/core.module';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize, first } from 'rxjs/operators';
import { ROUTE_ANIMATIONS_ELEMENTS } from '@core/core.module';
import {
  GoogleLoginProvider,
  SocialAuthService,
  SocialUser
} from 'angularx-social-login';
import { from } from 'rxjs';

const googleLogoURL = '@ass';

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

  // public socialUser: SocialUser;
  private loggedIn: boolean;

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authenticationService: AuthenticationService,
    private userService: UserService,
    private socialAuthService: SocialAuthService,
    private readonly notificationService: NotificationService
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

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', Validators.required],
      password: ['', Validators.required]
    });

    // get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  // convenience getter for easy access to form fields
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
          this.loading = false;
        }
      );
  }

  signInWithGoogle(): void {
    const socialPlatformProvider = GoogleLoginProvider.PROVIDER_ID;
    this.loading = true;
    this.socialAuthService.signIn(socialPlatformProvider).then(userData => {
      // Google returns user data. Send user token to the server
      localStorage.setItem('socialUser', JSON.stringify(userData));
      this.authenticationService
        .googleSignInExternal(userData.authToken)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe(result => {
          this.router.navigate(['/workarea']);
        });
    });
  }
  // Generic method to sign out, regardless of Auth provider
  signOut(): void {
    this.socialAuthService.signOut().then(data => {
      // debugger;
      this.router.navigate([`/login`]);
    });
  }
}
