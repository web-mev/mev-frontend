import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormGroup, Validators, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthenticationService } from '@app/_services/authentication.service';
import {
  NotificationService,
  ROUTE_ANIMATIONS_ELEMENTS
} from '@core/core.module';

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

  constructor(
    private authService: AuthenticationService,
    private readonly notificationService: NotificationService,
    private router: Router
  ) {}

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
            this.successMessage = null;
            this.errorMessage = 'Server Side Error';
            this.loading = false;
          }
        );
    } else {
      this.IsValidForm = false;
    }
  }
}
