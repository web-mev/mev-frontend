import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Inject,
  ViewChild
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SelectionModel } from '@angular/cdk/collections';
import { MatPaginator } from '@angular/material/paginator';

@Component({
  selector: 'mev-add-feature-set-dialog',
  templateUrl: './add-feature-set-dialog.component.html',
  styleUrls: ['./add-feature-set-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddFeatureSetDialogComponent implements OnInit {
  selection = new SelectionModel(true, []);
  allFeatureSetsDS;
  featureForm: FormGroup;
  submitted = false;
  featureSetsDisplayedColumns;
  featureSetsDisplayedColumnsAttributesOnly;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    private formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<AddFeatureSetDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.featureForm = this.formBuilder.group({
      featureSetName: ['', Validators.required]
    });
    this.allFeatureSetsDS = this.data.featureSetDS;

    this.featureSetsDisplayedColumns = this.data.featureSetsDisplayedColumns;
    this.featureSetsDisplayedColumnsAttributesOnly = this.data.featureSetsDisplayedColumnsAttributesOnly;
  }

  ngAfterViewInit() {
    this.allFeatureSetsDS.paginator = this.paginator;
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  submit() {
    // empty stuff
  }

  confirmAdd() {
    const name = this.featureForm.value.featureSetName;
    const samples = this.selection.selected;
    const featureSet = {
      name: name,
      type: 'Feature set',
      samples: samples
    };
    this.dialogRef.close(featureSet);
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.allFeatureSetsDS.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.allFeatureSetsDS.data.forEach(row => this.selection.select(row));
  }

  /** convenience getter for easy access to form fields */
  get f() {
    return this.featureForm.controls;
  }
}
