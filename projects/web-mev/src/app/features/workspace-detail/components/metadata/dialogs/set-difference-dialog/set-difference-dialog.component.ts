import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Inject
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import { CustomSetType } from '@app/_models/metadata';

/**
 * Modal dialog component which is used to order the custom sets
 * prior to requesting a set difference operation
 */
@Component({
  selector: 'mev-set-difference-dialog',
  templateUrl: './set-difference-dialog.component.html',
  styleUrls: ['./set-difference-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SetDifferenceDialogComponent implements OnInit {
  setupForm: FormGroup;
  sets;
  setNames;

  constructor(
    private formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<SetDifferenceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.setupForm = this.formBuilder.group({
      setName: ['', Validators.required],
      setColor: ['#000000', Validators.required]
    });
    console.log(this.data);
    this.sets = [this.data.setA, this.data.setB];
    this.setNames = [this.data.setAName, this.data.setBName];
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
  confirmCreate() {
    const name = this.setupForm.value.setName;
    const color = this.setupForm.value.setColor;
    const newSetData = {
      name: name,
      color: color,
      ordering: this.sets,
    };
    this.dialogRef.close(newSetData);
  }

  /**
   * Convenience getter for easy access to form fields
   */
  get f() {
    return this.setupForm.controls;
  }

  drop(event: CdkDragDrop<any[]>) {
    // move BOTH the names and the set object at the same time so they stay
    // aligned with each other.
    moveItemInArray(this.setNames, event.previousIndex, event.currentIndex);
    moveItemInArray(this.sets, event.previousIndex, event.currentIndex);
  }
}
