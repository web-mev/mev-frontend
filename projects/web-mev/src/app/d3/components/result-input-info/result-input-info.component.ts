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
        } else {
          this.inputList[formattedText] = value
        }

      }

    }
    // this.updateTooltipContent()
  }

  // tooltipContent = ''
  // newString = 'hello '

  // updateTooltipContent() {
  //   console.log("input list: ", this.inputList)
  //   // let newString = ''
  //   for(let key in this.inputList){
  //     let temp = `${key}: ${this.inputList[key]} `
  //     this.newString = this.newString + temp + " &#13; "
  //   }
  //   this.tooltipContent = this.newString;
  //   console.log("when finish: ", this.newString)
  // }


}