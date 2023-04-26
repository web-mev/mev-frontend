import { Component, ViewChild, OnInit, Input } from '@angular/core';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { AnalysesService } from '@app/features/analysis/services/analysis.service';
import igv from 'igv/dist/igv.esm.min.js';

@Component({
  selector: 'mev-igv',
  templateUrl: './igv.component.html',
  styleUrls: ['./igv.component.scss']
})
export class IGVComponent implements OnInit {
  @Input() workspaceResources = [];
  @ViewChild('igvDiv', { static: true }) igvDiv;
  selectedBAMFileId: string;
  selectedBAIFileId: string;
  selectedGenomeId: string;
  files = [];
  filesByType = {};
  genomeList = ['hg38', 'mm10', 'rn6', 'canFam3', 'dm6'];
  isWait = true;
  showIGV = false;

  igvForm: FormGroup;

  bam_url = 'https://webmev-example-data.s3.us-east-2.amazonaws.com/xyz.bam'
  bai_url = 'https://webmev-example-data.s3.us-east-2.amazonaws.com/xyz.bam.bai'
  options =
    {
      genome: "hg38",
      locus: "chr1:10000-10600",
      tracks: [
        {
          "name": "HG00103",
          "url": this.bam_url,
          "indexURL": this.bai_url,
          "format": "bam"
        }
      ]
    };

  constructor(
    private formBuilder: FormBuilder,
    private apiService: AnalysesService,
  ) { }

  ngOnInit(): void {
    this.igvForm = this.formBuilder.group({
      bam: [''],
      bai: [''],
      genome: ['']
    });
    this.files = this.workspaceResources;
    console.log("files: ", this.files)
    for (let i of this.files) {
      if (this.filesByType[i.resource_type] === undefined) {
        this.filesByType[i.resource_type] = [];
      }
      this.filesByType[i.resource_type].push(i)
    }

    this.isWait = false;

    igv.createBrowser(this.igvDiv.nativeElement, this.options)
      .then(function (browser) {
        console.log("Created IGV browser");
      })
  }

  onSelectBAM() {
  }

  onSelectBAI() {

  }

  onSelectGenome() {
  }

  // bamData = []

  onSubmit() {
    // this.showIGV = true;
    console.log(this.selectedBAMFileId, this.igvForm)
    // this.apiService
    //   .getResourceContent(this.selectedBAMFileId)
    //   .subscribe(features => {
    //     this.bamData = features;
    //     console.log(this.bamData)
    //   });

    igv.createBrowser(this.igvDiv.nativeElement, this.options)
      .then(function (browser) {
        console.log("Created IGV browser");
      })
  }
}