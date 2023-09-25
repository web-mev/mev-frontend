import { Component, OnInit, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MetadataService } from '@app/core/metadata/metadata.service';
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'mev-input-info',
  templateUrl: './result-input-info.component.html',
  styleUrls: ['./result-input-info.component.scss']
})
export class ResultInputInfoComponent implements OnInit {
  @Input() outputs;
  inputList = {}
  showDetails = false
  customSetDS;
  workspaceId: string;

  constructor(
    private httpClient: HttpClient,
    private metadataService: MetadataService,
    private route: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    this.workspaceId = this.route.snapshot.paramMap.get('workspaceId');
    this.getInputValues()
  }

  getInputValues() {
    let excludeList = ['operation', 'job_name', 'error_messages']

    const customSet = this.metadataService.getCustomSets();

    for (let key in this.outputs) {
      if (!excludeList.includes(key)) {
        const match = key.match(/\.(.+)/);
        let formattedText = ''
        if (match) {
          const capturedText = match[1];
          formattedText = capturedText.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        } else {
          formattedText = key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
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
          let customSetName = value['name']
          const exists = customSet.some(item => item.name === customSetName);
          if (exists) {
            this.inputList[formattedText] = value['name'];
          } else {
            let replacementName = value['elements'].length + " Samples";
            this.inputList[formattedText] = replacementName;
          }
        } else {
          this.inputList[formattedText] = value
        }
      }
    }
  }

}