import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ROUTE_ANIMATIONS_ELEMENTS } from '@app/core/core.module';
import { RepeatPasswordValidator } from '@app/shared/validators/validators';
import { UserService } from '@app/core/user/user.service';

/**
 * Password Change Component
 *
 * Display form to update user password
 */

@Component({
  selector: 'mev-password-change',
  templateUrl: './password-change.component.html',
  styleUrls: ['./password-change.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PasswordChangeComponent implements OnInit {
  routeAnimationsElements = ROUTE_ANIMATIONS_ELEMENTS;
  changePasswordForm: FormGroup;
  errorMessage: string;
  successMessage: string;
  loading = false;
  submitted = false;
  isFormValid = true;

  constructor(
    private userService: UserService, 
    private fb: FormBuilder,
    private changeDetectorRef: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.changePasswordForm = this.fb.group(
      {
        current_password: ['', [Validators.required]],
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
    return this.changePasswordForm.controls;
  }

  /**
   * Method for the form submission
   */

  changePassword() {
    this.submitted = true;
    if (this.changePasswordForm.valid) {
      this.loading = true;
      this.submitted = false;
      this.userService.changePassword(this.changePasswordForm.value).subscribe(
        data => {
          this.changePasswordForm.reset();
          this.isFormValid = true;
          this.errorMessage = null;
          this.successMessage = 'Your password has been successfully updated.';
          this.loading = false;
        },
        err => {
          this.errorMessage = err.error.current_password ? err.error.current_password : 'Server Side Error';
          this.successMessage = null;
          this.loading = false;
          this.changeDetectorRef.detectChanges();
        }
      );
    } else {
      this.isFormValid = false;
    }
  }
}
