import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Component, OnInit, ChangeDetectionStrategy, Inject } from '@angular/core';
import { WorkspaceDetailService } from '@app/features/workspace-detail/services/workspace-detail.service';
import { environment } from '@environments/environment';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'mev-add-dialog2',
  templateUrl: './add-dialog.component.html',
  styleUrls: ['./add-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddDialog2Component implements OnInit {
  private readonly API_URL = environment.apiUrl;
  trackFiles = [];
  indexFiles = [];
  selectedTrackFileId = '';
  selectedGenome = 'hg38';
  dropdownSettings = {};
  workspaceId: string;
  dialogType: string;
  resourceTypeDict = {};
  genomeList = ['hg38', 'hg18', 'hg19', 'canFam3', 'dm6'];

  constructor(
    public dialogRef: MatDialogRef<AddDialog2Component>,
    private apiService: WorkspaceDetailService,
    private httpClient: HttpClient,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit(): void {
    this.workspaceId = this.data.workspaceId;
    this.dialogType = this.data.dialogType;
    this.selectedGenome = this.data.genome;
    if (this.dialogType === 'track') {
      this.apiService.getAvailableResources().subscribe(data => {

        let track_files = [];
        for (let f of data) {
          if (f.resource_type === 'ALN' || f.resource_type === 'WIG' || f.resource_type === 'BIGWIG' || f.resource_type === 'BEDGRAPH') {
            track_files.push(f)
            let temp = {
              "resource_type": f.resource_type
            }
            this.resourceTypeDict[f.id] = temp
          }
          if (f.resource_type === 'BAI') {
            this.indexFiles.push(f)
          }
        }
        this.trackFiles = track_files;
      });
    }
    
    this.dropdownSettings = {
      text: 'Select resources',
      selectAllText: 'Select All',
      unSelectAllText: 'Unselect All',
      enableSearchFilter: true,
      searchBy: ['name', 'readable_resource_type'],
      lazyLoading: true,
      classes: 'resource-dropdown'
    };
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  // submit(file) {
  //   // empty stuff
  // }

  /**
   * Function is triggered when user clicks the Add button
   *
   */
  selectTrackFileName = '';
  confirmAdd() {
    for (let i of this.trackFiles) {
      if (i.id === this.selectedTrackFileId) {
        this.selectTrackFileName = i.name
      }
    }
    let temp = {
      track: this.selectedTrackFileId,
      index: this.selectedIndexFileId,
      name: this.selectTrackFileName,
      type: this.currResourceType,
      genome: this.selectedGenome
    }
    this.dialogRef.close(temp);
  }
  currResourceType = ''
  onSelectTrack() {
    this.currResourceType = this.resourceTypeDict[this.selectedTrackFileId]["resource_type"]

  }
  selectedIndexFileId = '';
}
