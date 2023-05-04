import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Component, OnInit, ChangeDetectionStrategy, Inject, Output, EventEmitter } from '@angular/core';
import { Validators, FormControl } from '@angular/forms';
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
  // @Output() filesAdded = new EventEmitter<any>();
  private readonly API_URL = environment.apiUrl;
  trackFiles = [];
  indexFiles = [];
  selectedTrackFileId = '';

  dropdownSettings = {};
  workspaceId: string;

  constructor(
    public dialogRef: MatDialogRef<AddDialog2Component>,
    private apiService: WorkspaceDetailService,
    private httpClient: HttpClient,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  formControl = new FormControl('', [Validators.required]);

  resourceTypeDict = {}

  ngOnInit(): void {
    this.workspaceId = this.data.workspaceId;
    this.apiService.getAvailableResources().subscribe(data => {
      console.log("data: ", data)
      let track_files = [];
      for (let f of data) {
        if (f.resource_type === 'ALN' || f.resource_type === 'WIG' || f.resource_type === 'BIGWIG' || f.resource_type === 'BEDGRAPH') {
          track_files.push(f)
          let temp = {
            "resource_type": f.resource_type
          }
          this.resourceTypeDict[f.id] = temp
        }
        if(f.resource_type === 'BAI'){
          this.indexFiles.push(f)
        }
      }
      this.trackFiles = track_files;
    });

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
  confirmAdd() {
    // this.selectedFiles.forEach(file => {
    //   this.apiService
    //     .addResourceToWorkspace(file.id, this.data.workspaceId)
    //     .subscribe();
    // });
    // this.filesAdded.emit(this.selectedFiles);
    // console.log(this.filesAdded, this.selectedFiles)
    console.log("selected file: ", this.selectedTrackFileId, this.resourceTypeDict[this.selectedTrackFileId]["resource_type"])
    let temp = {
      track: this.selectedTrackFileId,
      index: this.selectedIndexFileId
    }
    this.dialogRef.close(temp);
  }
  currResourceType = ''
  onSelectTrack(){
    console.log("selectedTrackFileId: ", this.selectedTrackFileId)
    this.currResourceType = this.resourceTypeDict[this.selectedTrackFileId]["resource_type"]

  }
  // filesByType = []
  selectedIndexFileId = '';
  // index_url = '';

  // onSelectIndex() {
  //   this.httpClient.get(
  //     `https://dev-mev-api.tm4.org/api/resources/${this.selectedIndexFileId}/`)
  //     .subscribe((response) => {
  //       this.index_url = response['datafile']
  //       console.log("res: ", response['datafile']);

  //     }, (error) => {
  //       console.error(error);
  //     });
  // }
}
