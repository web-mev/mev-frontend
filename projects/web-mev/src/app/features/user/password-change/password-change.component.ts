import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { AuthenticationService } from '@app/core/authentication/authentication.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ROUTE_ANIMATIONS_ELEMENTS } from '@app/core/core.module';
import { RepeatPasswordValidator } from '@app/shared/validators/validators';
import { UserService } from '@app/core/user/user.service';

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
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) {}

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

  // convenience getter for easy access to form fields
  get f() {
    return this.changePasswordForm.controls;
  }

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
          this.successMessage = null;
          this.errorMessage = 'Server Side Error';
          this.loading = false;
        }
      );
    } else {
      this.isFormValid = false;
    }
  }
}
