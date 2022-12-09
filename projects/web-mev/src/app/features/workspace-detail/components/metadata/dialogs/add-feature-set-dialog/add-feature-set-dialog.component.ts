import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Inject,
  ViewChild
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SelectionModel } from '@angular/cdk/collections';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatPaginator } from '@angular/material/paginator';
import { CustomSetType } from '@app/_models/metadata';
import { COMMA, ENTER, SPACE } from '@angular/cdk/keycodes';

/**
 * Add Feature Dialog Component
 *
 * Modal dialog component which is used to add a custom feature set
 */
@Component({
  selector: 'mev-add-feature-set-dialog',
  templateUrl: './add-feature-set-dialog.component.html',
  styleUrls: ['./add-feature-set-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddFeatureSetDialogComponent implements OnInit {
  featureSetForm: FormGroup;
  submitted = false;
  featureSet: string[] = [];
  removable = true;
  selectable = false;

  readonly separatorKeysCodes = [ENTER, COMMA, SPACE] as const;

  constructor(
    private formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<AddFeatureSetDialogComponent>,
  ) { }

  ngOnInit(): void {
    this.featureSetForm = this.formBuilder.group({
      featureSetName: ['', Validators.required],
      featureSetColor: ['#000000', Validators.required],
      individualFeatureName: ['']
    });
  }

  onAddFeature(event: MatChipInputEvent): void {
    const featureName = (event.value || '').trim();
    let featureNameArr = featureName.split(" ");

    for (let i = 0; i < featureNameArr.length; i++) {
      let index = this.featureSet.indexOf(featureNameArr[i]);
      if (featureNameArr[i] && index === -1) {
        this.featureSet.push(featureNameArr[i]);
      }
    }

    // Clear the input value
    event.chipInput!.clear();
    this.featureSetForm.controls['individualFeatureName'].setValue('');
  }

  remove(feature: string): void {
    const index = this.featureSet.indexOf(feature);

    if (index >= 0) {
      this.featureSet.splice(index, 1);
    }
  }

  /**
   * Function is triggered when user clicks the Cancel button
   *
   */
  onNoClick(): void {
    this.dialogRef.close();
  }

  submit() {
    //empty stuff
  }

  /**
   * Function is triggered when user clicks the Add button
   *
   */
  confirmAdd() {
    const name = this.featureSetForm.value.featureSetName;
    const color = this.featureSetForm.value.featureSetColor;
    const elements = this.featureSet.map(feature => {
      return { id: feature };
    });
    const newFeatureSet = {
      name: name,
      color: color,
      type: CustomSetType.FeatureSet,
      elements: elements,
      multiple: true
    };
    this.dialogRef.close(newFeatureSet);
  }

  /**
   * Convenience getter for easy access to form fields
   */
  get f() {
    return this.featureSetForm.controls;
  }
}
