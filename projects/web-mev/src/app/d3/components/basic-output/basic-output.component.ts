import { Component, OnInit, ChangeDetectionStrategy, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { environment } from '@environments/environment';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'mev-basic-output',
  templateUrl: './basic-output.component.html',
  styleUrls: ['./basic-output.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class BasicOutputComponent implements OnInit {
  @Input() outputs;

  private readonly API_URL = environment.apiUrl;

  operationName = '';
  outputFileKey = '';
  outputFileName = '';

  constructor(
    public dialog: MatDialog,
    private httpClient: HttpClient,
  ) { }

  ngOnInit(): void {
    this.operationName = this.outputs.operation.operation_name.replace(/\b\w/g, match => match.toUpperCase());

    //Checks the output for the key of the output file name. This could be different for each analysis.
    if (this.operationName === 'Methylation Curation') {
      this.outputFileKey = 'filtered_matrix'
    }

    if (this.outputFileKey !== '') {
      let outputId = this.outputs[this.outputFileKey]
      this.getOutputFileName(outputId)
    }
  }

  getOutputFileName(id) {
    let query = `${this.API_URL}/resources/${id}/`
    this.httpClient.get(query).subscribe(res => {
      this.outputFileName = res['name'];
    }),
      (error) => {
        console.error('Error: ', error);
      }
  }
}
