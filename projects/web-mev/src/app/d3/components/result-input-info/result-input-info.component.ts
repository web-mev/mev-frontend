import { Component, OnInit, Input } from '@angular/core';
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
    console.log("results input output: ", this.outputs)
    this.getInputValues()

  }

  getInputValues() {
    let excludeList = ['operation', 'job_name', 'error_messages']

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
            this.inputList[formattedText] = res['name']
          }),
            (error) => {
              console.error(`Error for ${key}: `, error);
              this.inputList[formattedText] = value
            }
        } else if (value['name'] && value['name'] !== undefined) {
          this.inputList[formattedText] = value['name']
        } else {
          this.inputList[formattedText] = value
        }
      }
    }
  }

}