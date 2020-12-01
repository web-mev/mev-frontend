import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Inject,
  ViewChild
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SelectionModel } from '@angular/cdk/collections';
import { MatPaginator } from '@angular/material/paginator';
import { CustomSetType } from '@app/_models/metadata';

@Component({
  selector: 'mev-edit-feature-set-dialog',
  templateUrl: './edit-feature-set-dialog.component.html',
  styleUrls: ['./edit-feature-set-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class EditFeatureSetDialogComponent implements OnInit {
  selection = new SelectionModel(true, []);
  allObservationSetsDS;
  observationForm: FormGroup;
  submitted = false;
  observationSetsDisplayedColumns;
  observationSetsDisplayedColumnsAttributesOnly;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    private formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<EditFeatureSetDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.observationForm = this.formBuilder.group({
      observationSetName: [this.data.name, Validators.required],
      observationSetColor: [this.data.color, Validators.required]
    });
    this.allObservationSetsDS = this.data.observationSetDS;

    this.observationSetsDisplayedColumns = this.data.observationSetsDisplayedColumns;
    this.observationSetsDisplayedColumnsAttributesOnly = this.data.observationSetsDisplayedColumnsAttributesOnly;

    this.allObservationSetsDS.data
      .filter(el =>
        this.data.selectedElements.some(selEl => selEl.id === el.id)
      )
      .forEach(row => {
        this.selection.select(row);
      });
  }

  ngAfterViewInit() {
    this.allObservationSetsDS.paginator = this.paginator;
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  submit() {
    //empty stuff
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.allObservationSetsDS.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.allObservationSetsDS.data.forEach(row =>
          this.selection.select(row)
        );
  }

  /** convenience getter for easy access to form fields */
  get f() {
    return this.observationForm.controls;
  }

  confirmEdit() {
    const name = this.observationForm.value.observationSetName;
    const color = this.observationForm.value.observationSetColor;
    const samples = this.selection.selected;
    const observationSet = {
      name: name,
      color: color,
      type: CustomSetType.ObservationSet,
      elements: samples,
      multiple: true
    };
    this.dialogRef.close(observationSet);
  }
}
