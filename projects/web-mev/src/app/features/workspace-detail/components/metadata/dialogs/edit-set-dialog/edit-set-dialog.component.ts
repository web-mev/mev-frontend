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

/**
 * Edit Feature/Observation Dialog Component
 *
 * Modal dialog component which is used to edit a custom feature or observation set
 * For Observation sets the user  can update name and the list of samples included
 * For Feature sets the user can update name
 */
@Component({
  selector: 'mev-edit-set-dialog',
  templateUrl: './edit-set-dialog.component.html',
  styleUrls: ['./edit-set-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class EditSetDialogComponent implements OnInit {
  selection = new SelectionModel(true, []);
  customSetType: string;
  isObservationSet = true;
  allObservationSetsDS;
  observationForm: FormGroup;
  submitted = false;
  observationSetsDisplayedColumns;
  observationSetsDisplayedColumnsAttributesOnly;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    private formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<EditSetDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    // if no custom set type is passed, assume Observation set by default
    this.customSetType = this.data?.type || CustomSetType.ObservationSet;
    if (this.customSetType === CustomSetType.FeatureSet) {
      this.isObservationSet = false;
    }
    this.observationForm = this.formBuilder.group({
      observationSetName: [this.data.name, Validators.required],
      observationSetColor: [
        this.data.color,
        [...(this.isObservationSet ? [Validators.required] : [])]
      ]
    });

    //if (this.isObservationSet) {
      this.allObservationSetsDS = this.data.observationSetDS;
      this.observationSetsDisplayedColumns = this.data.observationSetsDisplayedColumns;
      this.observationSetsDisplayedColumnsAttributesOnly = this.data.observationSetsDisplayedColumnsAttributesOnly;

      // this can be null if there were too many observations and we block manual editing of the set members
      if(this.allObservationSetsDS){
        this.allObservationSetsDS.data
          .filter(el =>
            this.data.selectedElements.some(selEl => selEl.id === el.id)
          )
          .forEach(row => {
            this.selection.select(row);
          });
      }
    //}
  }

  ngAfterViewInit() {
    if (this.allObservationSetsDS) {
      this.allObservationSetsDS.paginator = this.paginator;
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
   * Whether the number of selected elements matches the total number of rows.
   */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.allObservationSetsDS.filteredData.length;
    return numSelected === numRows;
  }

  /**
   * Selects all rows if they are not all selected; otherwise clear selection.
   */
  masterToggle() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.allObservationSetsDS.filteredData.forEach(row =>
          this.selection.select(row)
        );
  }

  /**
   * Convenience getter for easy access to form fields
   */
  get f() {
    return this.observationForm.controls;
  }

  /**
   * Method is triggered when user clicks the Save button
   *
   */
  confirmEdit() {
    const name = this.observationForm.value.observationSetName;
    const color = this.observationForm.value.observationSetColor;

    // if there are too many observations/samples in the workspace, then we disable the ability
    // to manually select/unselect. In that case, we need to preserve the original set of Observations.
    // Below, we use the this.allObservationSetsDS (which is null if manual editing is disabled) to
    // guide whether we take the elements from the table (this.selection.selected) OR keep the original
    // elements, which is contained in this.data.selectedElements
    let samples = this.selection.selected;
    // if(this.allObservationSetsDS){
    //   samples = this.selection.selected;
    // } else {
    //   samples = this.data.selectedElements;
    // }
    const observationSet = {
      name: name,
      color: color,
      type: this.customSetType,
      elements: samples,
      multiple: true
    };

    // for Feature sets users can't update sample list
    // if (this.customSetType === CustomSetType.ObservationSet) {
    //   observationSet['elements'] = samples;
    // }
    this.dialogRef.close(observationSet);
  }

  /**
   * Filtering observations by name
   */
  applyObservationFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase(); // MatTableDataSource defaults to lowercase matches
    this.allObservationSetsDS.filter = filterValue;
  }

  applyFeatureFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase(); // MatTableDataSource defaults to lowercase matches
    this.allObservationSetsDS.filter = filterValue;
  }
}
