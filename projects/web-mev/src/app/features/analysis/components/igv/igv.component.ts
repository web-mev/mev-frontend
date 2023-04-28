import { Component, ViewChild, OnInit, Input } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { AnalysesService } from '@app/features/analysis/services/analysis.service';
import { FileService } from '@app/features/file-manager/services/file-manager.service';
import { HttpClient } from '@angular/common/http';
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
  selectedIndexFileId: string;
  selectedGenomeId: string;
  files = [];
  filesByType = {};
  genomeList = ['hg38', 'mm10', 'rn6', 'canFam3', 'dm6'];
  isWait: boolean = false;
  showIGV = false;

  igvForm: FormGroup;

  // bam_url2 = 'https://webmev-example-data.s3.us-east-2.amazonaws.com/xyz.bam'
  // bai_url2 = 'https://webmev-example-data.s3.us-east-2.amazonaws.com/xyz.bam.bai'
  bam_url = '';
  bai_url = '';
  genome = '';

  constructor(
    private formBuilder: FormBuilder,
    private apiService: AnalysesService,
    public fileService: FileService,
    private httpClient: HttpClient,
  ) { }

  ngOnInit(): void {
    this.igvForm = this.formBuilder.group({
      bam: [''],
      bai: [''],
      genome: ['']
    });

    this.files = this.workspaceResources;

    for (let i of this.files) {
      if (this.filesByType[i.resource_type] === undefined) {
        this.filesByType[i.resource_type] = [];
      }
      this.filesByType[i.resource_type].push(i)
    }
  }

  onSelectBAM() {
    this.httpClient.get(
      `https://dev-mev-api.tm4.org/api/resources/${this.selectedBAMFileId}/`)
      .subscribe((response) => {
        this.bam_url = response['datafile']
        console.log("res: ", response['datafile']);
      }, (error) => {
        console.error(error);
      });
  }

  onSelectIndex() {
    this.httpClient.get(
      `https://dev-mev-api.tm4.org/api/resources/${this.selectedIndexFileId}/`)
      .subscribe((response) => {
        this.bai_url = response['datafile']
        console.log("res: ", response['datafile']);

      }, (error) => {
        console.error(error);
      });
  }

  onSelectGenome() {
    this.genome = this.selectedGenomeId
  }

  onSubmit() {
    let options =
    {
      genome: this.genome,
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

    igv.createBrowser(this.igvDiv.nativeElement, options)
      .then(function (browser) {
        console.log("Created IGV browser");
        const element = document.getElementById("igvDiv2") as HTMLElement;
        element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      })
      .catch(function (error) {
        console.error("An error occurred:", error);
      });


  }
}