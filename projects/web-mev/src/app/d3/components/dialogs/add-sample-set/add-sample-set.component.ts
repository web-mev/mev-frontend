import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Inject
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'mev-add-sample-set',
  templateUrl: './add-sample-set.component.html',
  styleUrls: ['./add-sample-set.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddSampleSetComponent {
  sapleSetName: string;
  constructor(
    public dialogRef: MatDialogRef<AddSampleSetComponent>,
    @Inject(MAT_DIALOG_DATA) public data
  ) {}

  formControl = new FormControl('', [Validators.required]);

  getErrorMessage() {
    return this.formControl.hasError('required') ? 'Required field' : '';
  }

  submit() {
    // empty stuff
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
