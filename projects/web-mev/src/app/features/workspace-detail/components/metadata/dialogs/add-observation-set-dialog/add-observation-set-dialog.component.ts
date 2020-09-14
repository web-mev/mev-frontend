import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Inject,
  ViewChild,
  ChangeDetectorRef
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SelectionModel } from '@angular/cdk/collections';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';

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
      observationSetName: ['', Validators.required]
    });
    this.allObservationSetsDS = this.data.observationSetDS;

    this.observationSetsDisplayedColumns = this.data.observationSetsDisplayedColumns;
    this.observationSetsDisplayedColumnsAttributesOnly = this.data.observationSetsDisplayedColumnsAttributesOnly;
  }

  ngAfterViewInit() {
    this.allObservationSetsDS.paginator = this.paginator;
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  submit() {
    this.submitted = true;
  }

  confirmAdd() {
    const name = this.observationForm.value.observationSetName;
    const samples = this.selection.selected;
    const observationSet = {
      name: name,
      type: 'Observation set',
      samples: samples
    };
    this.dialogRef.close(observationSet);
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
}
