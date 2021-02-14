import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';

import { UserService } from '@app/core/user/user.service';
import { NotificationService } from '@core/core.module';
import { AuthenticationService } from '@app/core/authentication/authentication.service';
import { ROUTE_ANIMATIONS_ELEMENTS } from '@core/core.module';
import { RepeatPasswordValidator } from '@app/shared/validators/validators';

/**
 * User Register Component
 *
 * Display user registration form
 */

@Component({
  selector: 'mev-register-form',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  routeAnimationsElements = ROUTE_ANIMATIONS_ELEMENTS;

  registerForm: FormGroup;
  loading = false;
  submitted = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authenticationService: AuthenticationService,
    private userService: UserService,
    private readonly notificationService: NotificationService
  ) {
    // redirect to workarea if already logged in
    if (this.authenticationService.currentUserValue) {
      this.router.navigate(['/workarea']);
    }
  }

  ngOnInit(): void {
    this.registerForm = this.formBuilder.group(
      {
        email: ['', Validators.required],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(
              '^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-_]).{8,}$'
            )
          ]
        ],
        confirm_password: ['', [Validators.required]]
      },
      { validator: RepeatPasswordValidator }
    );
  }

  /**
   * Convenience getter for easy access to form fields
   */
  get f() {
    return this.registerForm.controls;
  }

  onSubmit() {
    this.submitted = true;

    if (this.registerForm.valid) {
      this.loading = true;
      this.userService
        .register(this.registerForm.value)
        .pipe(first())
        .subscribe(
          data => {
            this.notificationService.success(
              'Registration is successful. Please check your email to activate your account.'
            );
            this.router.navigate(['/login']);
          },
          error => {
            this.notificationService.error(error);
            this.loading = false;
          }
        );
    }
  }
}
