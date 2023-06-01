import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Component, OnInit, ChangeDetectionStrategy, Inject } from '@angular/core';
import { WorkspaceDetailService } from '@app/features/workspace-detail/services/workspace-detail.service';
import { environment } from '@environments/environment';

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
  selectedIndexFileId = '';
  selectedGenome = 'Mm10 (UCSC)';
  selectTrackFileName = '';
  currResourceType = '';
  dropdownSettings = {};
  workspaceId: string;
  dialogType: string;
  resourceTypeDict = {};
  genomeList = [
    {
      name: 'GRCh37 (Ensembl)',
      value: 'hg19'
    },
    {
      name: 'Hg19 (UCSC)',
      value: 'hg19'
    },
    {
      name: 'GRCh38 (Ensembl)',
      value: 'hg38'
    },
    {
      name: 'Hg38 (UCSC)',
      value: 'hg38'
    },
    {
      name: 'GRCm39 (Ensembl)',
      value: 'mm39'
    },
    {
      name: 'GRCm38 (Ensembl)',
      value: 'mm10'
    },
    {
      name: 'Mm39 (UCSC)',
      value: 'mm39'
    },
    {
      name: 'Mm10 (UCSC)',
      value: 'mm10'
    }
  ]

  constructor(
    public dialogRef: MatDialogRef<AddDialog2Component>,
    private apiService: WorkspaceDetailService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit(): void {
    this.workspaceId = this.data.workspaceId;
    this.dialogType = this.data.dialogType;
    for (let i = 0; i < this.genomeList.length; i++) {
      if (this.genomeList[i]["value"] === this.data.genome) {
        this.selectedGenome = this.genomeList[i]["value"];
      }
    }
    if (this.dialogType === 'track') {
      this.apiService.getAvailableResources().subscribe(data => {
        let track_files = [];
        for (let f of data) {
          if (f.resource_type === 'ALN' || f.resource_type === 'WIG' || f.resource_type === 'BIGWIG' || f.resource_type === 'BEDGRAPH' || f.resource_type === 'BED6' || f.resource_type === 'BED3') {
            track_files.push(f);
            let resourceType = {
              "resource_type": f.resource_type
            }
            this.resourceTypeDict[f.id] = resourceType;
          } else if (f.resource_type === 'BAI') {
            this.indexFiles.push(f);
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

  confirmAdd() {
    for (let i of this.trackFiles) {
      if (i.id === this.selectedTrackFileId) {
        this.selectTrackFileName = i.name;
      }
    }

    let filedata = {
      track: this.selectedTrackFileId,
      index: this.selectedIndexFileId,
      name: this.selectTrackFileName,
      type: this.currResourceType,
      genome: this.selectedGenome,
      dialogType: this.dialogType
    }

    this.dialogRef.close(filedata);
  }

  onSelectTrack() {
    this.currResourceType = this.resourceTypeDict[this.selectedTrackFileId]["resource_type"];
  }
}
