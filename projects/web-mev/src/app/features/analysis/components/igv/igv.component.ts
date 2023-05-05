import { Component, ViewChild, OnInit, Input, Renderer2 } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { FileService } from '@app/features/file-manager/services/file-manager.service';
import { HttpClient } from '@angular/common/http';
import igv from 'igv/dist/igv.esm.min.js';
import { MatDialog } from '@angular/material/dialog';
import { AddDialog2Component } from './add-dialog/add-dialog.component';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'mev-igv',
  templateUrl: './igv.component.html',
  styleUrls: ['./igv.component.scss']
})
export class IGVComponent implements OnInit {
  @Input() workspaceResources = [];
  @ViewChild('igvDiv', { static: true }) igvDiv;
  workspaceId: string;
  selectedBAMFileName: string;
  selectedBAMFileId: string;
  selectedIndexFileId: string;
  selectedGenomeId: string;
  files = [];
  filesByType = {};
  genomeList = ['hg38', 'mm10', 'rn6', 'canFam3', 'dm6'];
  isWait: boolean = false;
  showIGV = false;
  panelOpenState = true;

  igvForm: FormGroup;

  // bam_url2 = 'https://webmev-example-data.s3.us-east-2.amazonaws.com/xyz.bam'
  // bai_url2 = 'https://webmev-example-data.s3.us-east-2.amazonaws.com/xyz.bam.bai'
  bam_url = '';
  index_url = '';
  genome = 'hg38';

  constructor(
    private formBuilder: FormBuilder,
    public fileService: FileService,
    private httpClient: HttpClient,
    public dialog: MatDialog,
    private route: ActivatedRoute,
    private renderer: Renderer2
  ) { }

  ngOnInit(): void {
    this.workspaceId = this.route.snapshot.paramMap.get('workspaceId');
    console.log("workspaceId: ", this.workspaceId)
    this.igvForm = this.formBuilder.group({
      // bam: ['', Validators.required],
      // index: ['', Validators.required],
      genome: ['', Validators.required]
    });

    this.files = this.workspaceResources;

    for (let i of this.files) {
      if (this.filesByType[i.resource_type] === undefined) {
        this.filesByType[i.resource_type] = [];
      }
      this.filesByType[i.resource_type].push(i)
    }

    let options =
    {
      genome: this.genome,
      locus: "chr1:10000-10600",
      tracks: []
    };

    this.createBrowser(options);
  }

  // onSelectBAM() {
  //   this.httpClient.get(
  //     `https://dev-mev-api.tm4.org/api/resources/${this.selectedBAMFileId}/`)
  //     .subscribe((response) => {
  //       this.bam_url = response['datafile']
  //       console.log("res: ", response['datafile']);
  //     }, (error) => {
  //       console.error(error);
  //     });
  // }

  selectedBAMData = [];

  addItem() {
    const dialogRef = this.dialog.open(AddDialog2Component, {
      data: { workspaceId: this.workspaceId }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
      console.log("closed results: ", result); // This will log the selectedFiles array


      // let selectedBAMFileArr = [];
      // this.selectedBAMData = result;
      // for (let obj of result) {
      //   selectedBAMFileArr.push(obj['name'])
      // }
      // this.selectedBAMFileName = selectedBAMFileArr.join(', ')
      // this.selectedBAMFileId = result[0]['id']




      //NEED TO HANDLE THIS AS AN ARRAY instead of doing just one
      if (result != undefined) {
        this.selectedBAMData.push(result);
      }

    });
  }

  // onSelectIndex() {
  //   console.log("index: ", this.selectedIndexFileId)
  //   this.httpClient.get(
  //     `https://dev-mev-api.tm4.org/api/resources/${this.selectedIndexFileId}/`)
  //     .subscribe((response) => {
  //       this.index_url = response['datafile']
  //       console.log("res: ", response['datafile']);

  //     }, (error) => {
  //       console.error(error);
  //     });
  // }

  onSelectGenome() {
    this.genome = this.selectedGenomeId
  }
  expandState = true;

  onSubmit() {
    const div = this.igvDiv.nativeElement;
    this.renderer.setProperty(div, 'innerHTML', '');

    this.expandState = false;
    this.isWait = true;
    let tracksArr = [];

    for (let i = 0; i < this.selectedBAMData.length; i++) {
      this.selectedBAMFileId = this.selectedBAMData[i]['track']
      this.httpClient.get(
        `https://dev-mev-api.tm4.org/api/resources/${this.selectedBAMFileId}/`)
        .subscribe((response) => {
          this.bam_url = response['datafile']
          console.log("res: ", response['datafile']);
        }, (error) => {
          console.error(error);
        });

      this.selectedIndexFileId = this.selectedBAMData[i]['index'];
      this.httpClient.get(
        `https://dev-mev-api.tm4.org/api/resources/${this.selectedIndexFileId}/`)
        .subscribe((response) => {
          this.index_url = response['datafile']
          console.log("res: ", response['datafile']);

        }, (error) => {
          console.error(error);
        });

        let test = {
          "name": "HG00103",
          "url": this.bam_url,
          "indexURL": this.index_url,
          "format": "bam"
        }
        tracksArr.push(test)
    }

    let options =
    {
      genome: this.genome,
      locus: "chr1:10000-10600",
      tracks: tracksArr
    };

    this.createBrowser(options);

    // igv.createBrowser(this.igvDiv.nativeElement, options)
    //   .then(browser => {
    //     console.log("options: ", options)
    //     this.isWait = false;
    //     const element = document.getElementById("igvDiv2") as HTMLElement;
    //     element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    //   })
    //   .catch(error => {
    //     console.error("An error occurred:", error);
    //   });
  }

  createBrowser(options){
    igv.createBrowser(this.igvDiv.nativeElement, options)
      .then(browser => {
        console.log("options: ", options)
        this.isWait = false;
        const element = document.getElementById("igvDiv2") as HTMLElement;
        element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      })
      .catch(error => {
        console.error("An error occurred:", error);
      });
  }
}