import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Component, OnInit, ChangeDetectionStrategy, Inject } from '@angular/core';
import { environment } from '@environments/environment';

@Component({
  selector: 'mev-axisLabelDialog',
  templateUrl: './axisLabelDialog.component.html',
  styleUrls: ['./axisLabelDialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AxisLabelDialogComponent implements OnInit {
  private readonly API_URL = environment.apiUrl;
  newLabel = '';
  node1Value = '';
  node2Value = ''

  constructor(
    public dialogRef: MatDialogRef<AxisLabelDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit(): void {
    this.node1Value = localStorage.getItem('node1');
    this.node2Value = localStorage.getItem('node2');
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  updateLabel() {
    let data = {
      "node1": this.node1Value,
      "node2": this.node2Value
    }

    this.dialogRef.close(data);
  }

  submit() {
    // empty stuff
  }
}
