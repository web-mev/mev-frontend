import { Component, ViewChild, OnInit, Input } from '@angular/core';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import igv from 'igv/dist/igv.esm.min.js';

@Component({
  selector: 'mev-igv',
  templateUrl: './igv.component.html',
  styleUrls: ['./igv.component.scss']
})
export class IGVComponent implements OnInit {
  @Input() workspaceResources = [];
  @ViewChild('igvDiv', { static: true }) igvDiv;
  selectedBAMFileId: string
  files = [];
  isWait = true;

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
    private formBuilder: FormBuilder
  ) { }

  ngOnInit(): void {
    this.igvForm = this.formBuilder.group({
      bam: [''],
      bai: [''],
      genome: ['']
    });
    this.files = this.workspaceResources;
    this.isWait = false;

    igv.createBrowser(this.igvDiv.nativeElement, this.options)
      .then(function (browser) {
        console.log("Created IGV browser");
      })
  }

  onSubmit() {

  }
}