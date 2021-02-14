import { FormGroup } from '@angular/forms';

/**
 * Password validator
 *
 * Used to validate passwords for Registration, Password Change and Password Reset forms
 */
export function RepeatPasswordValidator(passwordFormGroup: FormGroup) {
  const new_password = passwordFormGroup.controls.password.value;
  const confirm_password = passwordFormGroup.controls.confirm_password.value;

  if (!confirm_password || !new_password) {
    passwordFormGroup.controls.confirm_password.setErrors(null);
  }

  if (confirm_password !== new_password) {
    passwordFormGroup.controls.confirm_password.setErrors({
      notMatched: true
    });
  } else {
    passwordFormGroup.controls.confirm_password.setErrors(null);
  }
}
