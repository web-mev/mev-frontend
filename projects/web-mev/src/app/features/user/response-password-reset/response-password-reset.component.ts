import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { AuthenticationService } from '@app/_services/authentication.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ROUTE_ANIMATIONS_ELEMENTS } from '@app/core/core.module';
import { RepeatPasswordValidator } from '@app/shared/validators/validators';

@Component({
  selector: 'mev-response-password-reset',
  templateUrl: './response-password-reset.component.html',
  styleUrls: ['./response-password-reset.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResponsePasswordResetComponent implements OnInit {
  routeAnimationsElements = ROUTE_ANIMATIONS_ELEMENTS;

  responseResetForm: FormGroup;
  errorMessage: string;
  successMessage: string;
  loading = false;
  submitted = false;
  resetToken: null;
  uid: null;
  CurrentState: any;
  IsResetFormValid = true;

  constructor(
    private authService: AuthenticationService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) {
    this.CurrentState = 'Wait';
    this.route.params.subscribe(params => {
      this.resetToken = params.token;
      this.uid = params.uid;
      this.VerifyToken();
    });
  }

  ngOnInit(): void {
    this.Init();
  }

  // convenience getter for easy access to form fields
  get f() {
    return this.responseResetForm.controls;
  }

  VerifyToken() {
    this.CurrentState = 'Verified';
    this.authService
      .ValidPasswordToken({ token: this.resetToken, uid: this.uid })
      .subscribe(
        data => {
          this.CurrentState = 'Verified';
        },
        err => {
          this.CurrentState = 'NotVerified';
        }
      );
  }

  Init() {
    this.responseResetForm = this.fb.group(
      {
        token: [this.resetToken],
        uid: [this.uid],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(
              '^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$'
            )
          ]
        ],
        confirm_password: ['', [Validators.required]]
      },
      { validator: RepeatPasswordValidator }
    );
  }

  ResetPassword() {
    this.submitted = true;
    if (this.responseResetForm.valid) {
      // this.IsResetFormValid = true;
      this.loading = true;

      this.authService
        .confirmPasswordReset(this.responseResetForm.value)
        .subscribe(
          data => {
            this.responseResetForm.reset();
            this.IsResetFormValid = true;
            this.successMessage =
              'Your password has been successfully updated. Redirecting to Sign-in page...';
            setTimeout(() => {
              this.successMessage = null;
              this.router.navigate(['login']);
            }, 5000);
          },
          err => {
            this.successMessage = null;
            this.errorMessage = 'Server Side Error';
            this.loading = false;
          }
        );
    } else {
      this.IsResetFormValid = false;
    }
  }
}
