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
import { MatPaginator } from '@angular/material/paginator';
import { CustomSetType } from '@app/_models/metadata';

/**
 * Add Observation Dialog Component
 *
 * Modal dialog component which is used to add a custom observation set
 */
@Component({
  selector: 'mev-add-observation-set-dialog',
  templateUrl: './add-observation-set-dialog.component.html',
  styleUrls: ['./add-observation-set-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddObservationSetDialogComponent implements OnInit {
  selection = new SelectionModel(true, []);
  allObservationSetsDS;
  observationForm: FormGroup;
  submitted = false;
  observationSetsDisplayedColumns;
  observationSetsDisplayedColumnsAttributesOnly;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    private formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<AddObservationSetDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.observationForm = this.formBuilder.group({
      observationSetName: ['', Validators.required],
      observationSetColor: ['#000000', Validators.required]
    });
    this.allObservationSetsDS = this.data.observationSetDS;

    this.observationSetsDisplayedColumns = this.data.observationSetsDisplayedColumns;
    this.observationSetsDisplayedColumnsAttributesOnly = this.data.observationSetsDisplayedColumnsAttributesOnly;
  }

  ngAfterViewInit() {
    this.allObservationSetsDS.paginator = this.paginator;
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
   * Filtering observations by name
   */
  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase(); // MatTableDataSource defaults to lowercase matches
    this.allObservationSetsDS.filter = filterValue;
  }

  /**
   * Convenience getter for easy access to form fields
   */
  get f() {
    return this.observationForm.controls;
  }
}
