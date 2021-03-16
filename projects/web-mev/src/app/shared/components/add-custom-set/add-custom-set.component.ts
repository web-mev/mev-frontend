import { Component, ChangeDetectionStrategy, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { CustomSetType } from '../../../_models/metadata';

@Component({
  selector: 'mev-add-custom-set',
  templateUrl: './add-custom-set.component.html',
  styleUrls: ['./add-custom-set.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddCustomSetComponent {
  setForm: FormGroup;
  isObservationSet = true;
  customSetType: string;
  constructor(
    private formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<AddCustomSetComponent>,
    @Inject(MAT_DIALOG_DATA) public data
  ) {}

  ngOnInit(): void {
    // if no custom set type is passed, assume Observation set by default
    this.customSetType = this.data?.type || CustomSetType.ObservationSet;
    const name = this.data?.name || '';
    if (this.customSetType === CustomSetType.FeatureSet) {
      this.isObservationSet = false;
    }

    this.setForm = this.formBuilder.group({
      customSetName: [name, [Validators.required]],
      customSetColor: [
        '#000000',
        //[...(this.isObservationSet ? [Validators.required] : [])]
        [Validators.required]
      ]
    });
  }

  submit() {
    // empty stuff
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  confirmAdd() {
    const name = this.setForm.value.customSetName;
    const color = this.setForm.value.customSetColor;

    const customSet = {
      name: name,
      color: color
    };
    this.dialogRef.close(customSet);
  }
}
