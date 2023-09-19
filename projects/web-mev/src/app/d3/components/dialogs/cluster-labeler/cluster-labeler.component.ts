import { Component, ChangeDetectionStrategy, Inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'mev-cluster-labeler',
  templateUrl: './cluster-labeler.component.html',
  styleUrls: ['./cluster-labeler.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClusterLabelerComponent {
  labelForm: FormGroup;
 
  constructor(
    private formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<ClusterLabelerComponent>
  ) {}

  ngOnInit(): void {

    this.labelForm = this.formBuilder.group({
      clusterPrefix: ['', [Validators.required]]
    });
  }

  submit() {
    // empty stuff
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  confirmAdd() {
    const prefix = this.labelForm.value.clusterPrefix;
    const data = {prefix: prefix};
    this.dialogRef.close(data);
  }
}
