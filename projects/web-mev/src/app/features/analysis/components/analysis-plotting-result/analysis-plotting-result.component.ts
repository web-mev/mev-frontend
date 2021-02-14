import { Component, ChangeDetectionStrategy, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

/**
 * Analysis Plotting Result Component
 * Container component used for displaying plotting results
 * It is a front-end only operation and no real operation is executed, so
 * use modal dialog to display plotting results and not Executed Operation Component
 */
@Component({
  selector: 'mev-analysis-plotting-result',
  templateUrl: './analysis-plotting-result.component.html',
  styleUrls: ['./analysis-plotting-result.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnalysisPlottingResultComponent {
  constructor(
    public dialogRef: MatDialogRef<AnalysisPlottingResultComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}
}
