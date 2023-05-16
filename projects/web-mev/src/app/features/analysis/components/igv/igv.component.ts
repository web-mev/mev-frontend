import { Component, ViewChild, OnInit, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FileService } from '@app/features/file-manager/services/file-manager.service';
import { HttpClient } from '@angular/common/http';
import igv from 'igv/dist/igv.esm.min.js';
import { MatDialog } from '@angular/material/dialog';
import { AddDialog2Component } from './add-dialog/add-dialog.component';
import { ActivatedRoute } from '@angular/router';
import { environment } from '@environments/environment';

@Component({
  selector: 'mev-igv',
  templateUrl: './igv.component.html',
  styleUrls: ['./igv.component.scss']
})
export class IGVComponent implements OnInit {
  @Input() workspaceResources = [];
  @ViewChild('igvDiv', { static: true }) igvDiv;
  private readonly API_URL = environment.apiUrl;
  workspaceId: string;
  selectedBAMFileName: string;
  selectedBAMFileId: string;
  selectedIndexFileId: string;
  selectedGenomeId: string;
  files = [];
  filesByType = {};
  isWait: boolean = false;
  panelOpenState = true;

  igvForm: FormGroup;

  bam_url = '';
  index_url = '';
  genome = 'hg38';

  selectedBAMData = [];
  trackNames = [];
  expandState = true;
  fullTracksArr = [];

  constructor(
    public fileService: FileService,
    private httpClient: HttpClient,
    public dialog: MatDialog,
    private route: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    this.workspaceId = this.route.snapshot.paramMap.get('workspaceId');
    this.files = this.workspaceResources;

    for (let i of this.files) {
      if (this.filesByType[i.resource_type] === undefined) {
        this.filesByType[i.resource_type] = [];
      }
      this.filesByType[i.resource_type].push(i)
    }

    const options = {
      genome: this.genome,
      locus: "chr1:10000-10600",
    };

    igv.createBrowser(this.igvDiv.nativeElement, options)
  }

  addItem(type) {
    const dialogRef = this.dialog.open(AddDialog2Component, {
      data: {
        workspaceId: this.workspaceId,
        dialogType: type,
        genome: this.genome
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result != undefined) {
        this.selectedBAMData.push(result);

        if (result.name !== '' && result.name !== undefined) {
          this.trackNames.push(result.name)
        }
        this.genome = result.genome
        if(result.dialogType === 'genome'){
          this.onSubmitGenome()
        }
        else if(this.trackNames.length > 0 && this.genome !== '' && this.genome !== undefined){
          this.onSubmit();
        }
      }
    });
  }

  onSubmitGenome(){
    igv.removeAllBrowsers()

    let options =
    {
      genome: this.genome,
      locus: "chr1:10000-10600",
      tracks: this.fullTracksArr
    };

    this.createBrowser(options);
  }

  async onSubmit() {
    igv.removeAllBrowsers()

    this.expandState = false;
    this.isWait = true;
    let tracksArr = [];

    for (let i = 0; i < this.selectedBAMData.length; i++) {
      this.selectedBAMFileId = this.selectedBAMData[i]['track']
      try {
        const response = await this.httpClient.get(`${this.API_URL}/resources/signed-url/${this.selectedBAMFileId}/`).toPromise();
        this.bam_url = response['url'];

        if (this.selectedBAMData[i]['type'] === 'ALN') {
          this.selectedIndexFileId = this.selectedBAMData[i]['index'];
          const response = await this.httpClient.get(`${this.API_URL}/resources/signed-url/${this.selectedIndexFileId}/`).toPromise();
          this.index_url = response['url']
          let test = {
            "name": this.selectedBAMData[i]['name'],
            "url": this.bam_url,
            "indexURL": this.index_url,
            "format": "bam"
          }
          tracksArr.push(test)
        } else if (this.selectedBAMData[i]['type'] === 'WIG' || this.selectedBAMData[i]['type'] === 'BIGWIG' || this.selectedBAMData[i]['type'] === 'BEDGRAPH') {
          this.index_url = response['url']
          let type = this.selectedBAMData[i]['type'].toLowerCase()
          if (type === 'bigwig' || type === 'bedgraph') {
            type = 'wig'
          }
          let test = {
            type: type,
            name: this.selectedBAMData[i]['name'],
            url: this.index_url,
            min: "0",
            autoscale: true,
            color: "rgb(0, 0, 150)",
            guideLines: [
              { color: 'green', dotted: true, y: 25 },
              { color: 'red', dotted: false, y: 5 }
            ]
          }
          tracksArr.push(test)
        }
      } catch (error) {
        console.error(error);
      }
    }
    this.fullTracksArr = tracksArr;

    let options =
    {
      genome: this.genome,
      locus: "chr1:10000-10600",
      tracks: tracksArr
    };
    await this.createBrowser(options);
  }

  createBrowser(options) {
    igv.createBrowser(this.igvDiv.nativeElement, options)
      .then(browser => {
        this.isWait = false;
        const element = document.getElementById("igvDiv2") as HTMLElement;
        element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      })
      .catch(error => {
        console.error("An error occurred:", error);
      });
  }

  reset() {
    this.genome = 'hg38';
    this.trackNames = [];
    this.fullTracksArr = [];
    this.selectedBAMData = [];

    this.bam_url = '';
    this.index_url = '';

    igv.removeAllBrowsers()
    const options = {
      genome: this.genome,
      locus: "chr1:10000-10600",
    };

    igv.createBrowser(this.igvDiv.nativeElement, options)
  }
}