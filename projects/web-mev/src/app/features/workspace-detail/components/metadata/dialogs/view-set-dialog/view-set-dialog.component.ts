import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Inject
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CustomSetType } from '@app/_models/metadata';

/**
 * View Custom Feature/Observation Dialog Component
 *
 * Modal dialog component which is used to view a custom feature or observation set
 * User can view set name and the list of features/samples
 */
@Component({
  selector: 'mev-view-set-dialog',
  templateUrl: './view-set-dialog.component.html',
  styleUrls: ['./view-set-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewSetDialogComponent implements OnInit {
  isObservationSet: boolean;

  constructor(
    public dialogRef: MatDialogRef<ViewSetDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  /*
   * Initialization of the isObservationSet property
   * If no set type, use Observation Set type by default
   */
  ngOnInit(): void {
    this.isObservationSet =
      this.data.type === CustomSetType.FeatureSet ? false : true;
  }

  /**
   * Function is triggered when user clicks the Close button
   *
   */
  onNoClick(): void {
    this.dialogRef.close();
  }
}
