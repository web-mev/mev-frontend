import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Inject
} from '@angular/core';
import { Router, Params } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { Validators, FormControl } from '@angular/forms';
import { WorkspaceDetailService } from '@app/features/workspace-detail/services/workspace-detail.service';

@Component({
  selector: 'mev-add-dialog',
  templateUrl: './add-dialog.component.html',
  styleUrls: ['./add-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddDialogComponent implements OnInit {
  fileList = [];
  selectedFiles = [];
  dropdownSettings = {};
  workspaceId: string;

  constructor(
    public dialogRef: MatDialogRef<AddDialogComponent>,
    private apiService: WorkspaceDetailService,
    private router: Router,
    private route: ActivatedRoute,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  formControl = new FormControl('', [Validators.required]);

  ngOnInit(): void {
    this.route.params.subscribe(
      (params: Params) => (this.workspaceId = params['workspaceId'])
    );

    this.apiService.getAvailableResources().subscribe(data => {
      this.fileList = data;
    });

    this.dropdownSettings = {
      text: 'Select resources',
      selectAllText: 'Select All',
      unSelectAllText: 'UnSelect All',
      classes: 'resource-dropdown'
    };
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  submit() {
    // empty stuff
  }

  confirmAdd() {
    this.selectedFiles.forEach(file => {
      this.apiService
        .addResourceToWorkspace(file.id, this.data.workspaceId)
        .subscribe(data => {
          this.router.navigate(['workspace', this.workspaceId]);
        });
    });
  }

  getErrorMessage() {
    return this.formControl.hasError('required')
      ? 'Required field'
      : this.formControl.hasError('email')
      ? 'Not a valid email'
      : '';
  }

  onItemSelect(item: any) {
    console.log(item);
    console.log(this.selectedFiles);
  }
  OnItemDeSelect(item: any) {
    console.log(item);
    console.log(this.selectedFiles);
  }
  onSelectAll(items: any) {
    console.log(items);
  }
  onDeSelectAll(items: any) {
    console.log(items);
  }
}
