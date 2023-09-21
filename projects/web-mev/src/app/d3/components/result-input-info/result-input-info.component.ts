import { Component, ViewChild, OnInit, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'mev-input-info',
  templateUrl: './result-input-info.component.html',
  styleUrls: ['./result-input-info.component.scss']
})
export class ResultInputInfoComponent implements OnInit {
  @Input() outputs;
  inputList = {}
  showDetails = false

  constructor(
    private httpClient: HttpClient,
  ) { }

  ngOnInit(): void {
    this.getInputValues()
  }

  getInputValues() {
    console.log("result input info: ", this.outputs)
    let excludeList = ['operation', 'job_name', 'error_messages']

    // let inputList = {}

    for (let key in this.outputs) {
      if (!excludeList.includes(key)) {

        const match = key.match(/\.(.+)/);
        let formattedText = ''
        if (match) {
          const capturedText = match[1];
          formattedText = capturedText.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        }

        let value = this.outputs[key]
        if (value.length === 36) {
          let query = `https://dev-mev-api.tm4.org/api/resources/${value}/`
          this.httpClient.get(query).subscribe(res => {
            // console.log(`${key}: `, res['name'], res)
            this.inputList[formattedText] = res['name']
          }),
            (error) => {
              console.error(`Error for ${key}: `, error);
              this.inputList[formattedText] = value
            }
        } else {
          this.inputList[formattedText] = value
        }

      }

    }
    console.log("input list: ", this.inputList)
    //get these values from analysis-result and query the api for the name of the file
    // let input_matrix_a = "e85b5f38-f6a9-4ad2-a8d0-2b7cba1d4328"
    // // let input_matrix_b = "1f8fb6e2-15f3-4dea-9b81-23f2f8dfce2b"
    // let input_matrix_b = "d3c3754c-43d6-49ff-843b-1b484e5c749f"
    // let sample_arrangement = "sample ID"
    // let query_a = `https://dev-mev-api.tm4.org/api/resources/${input_matrix_a}/`
    // let query_b = `https://dev-mev-api.tm4.org/api/resources/${input_matrix_b}/`
    // this.httpClient.get(query_a).subscribe(res => {
    //     console.log("input_a: ", res['name'], res)
    // })
    // this.httpClient.get(query_b).subscribe(res => {
    //     console.log("input_b: ", res['name'])
    // })
  }


}