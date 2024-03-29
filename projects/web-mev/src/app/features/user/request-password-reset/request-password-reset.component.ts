import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormGroup, Validators, FormControl } from '@angular/forms';
import { AuthenticationService } from '@app/core/authentication/authentication.service';
import { ROUTE_ANIMATIONS_ELEMENTS } from '@core/core.module';

/**
 * Request Password Reset Component
 *
 * Display form with email to allow user to reset password
 */

@Component({
  selector: 'mev-request-password-reset',
  templateUrl: './request-password-reset.component.html',
  styleUrls: ['./request-password-reset.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class RequestPasswordResetComponent implements OnInit {
  routeAnimationsElements = ROUTE_ANIMATIONS_ELEMENTS;
  RequestResetForm: FormGroup;
  forbiddenEmails: any;
  errorMessage: string;
  successMessage: string;
  IsValidForm = true;
  loading = false;

  constructor(private authService: AuthenticationService) {}

  ngOnInit(): void {
    this.RequestResetForm = new FormGroup({
      email: new FormControl(
        null,
        [Validators.required, Validators.email],
        this.forbiddenEmails
      )
    });
  }

  RequestResetUser(form) {
    if (form.valid) {
      this.IsValidForm = true;
      this.loading = true;
      this.authService
        .requestPasswordReset(this.RequestResetForm.value)
        .subscribe(
          data => {
            this.RequestResetForm.reset();
            this.errorMessage = null;
            this.successMessage =
              'We have sent you a password reset link to your e-mail. Please check your inbox.';
            this.loading = false;
            setTimeout(() => {
              this.loading = false;
            }, 2000);
          },
          err => {
            this.errorMessage = err.error.email ? err.error.email : 'Server Side Error';
            this.successMessage = null;
            this.loading = false;
          }
        );
    } else {
      this.IsValidForm = false;
    }
  }
}
