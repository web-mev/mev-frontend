import { Component, OnInit, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MetadataService } from '@app/core/metadata/metadata.service';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { InputInfoDialogComponent } from './inputInfoDialog/input-info-dialog.component';
import { environment } from '@environments/environment';

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
  private readonly API_URL = environment.apiUrl;

  // allows us to identify which inputs are files:
  fileTypes = ['VariableDataResource', 'DataResource']

  constructor(
    private httpClient: HttpClient,
    private metadataService: MetadataService,
    private route: ActivatedRoute,
    public dialog: MatDialog,
  ) { }

  ngOnInit(): void {
    this.workspaceId = this.route.snapshot.paramMap.get('workspaceId');
    this.getInputValues();
  }

  getInputValues() {
    const customSet = this.metadataService.getCustomSets();

    let validInputValues = [];
    for (let key in this.outputs.operation.inputs) {
      validInputValues.push(key)
    }

    for (let key in this.outputs) {
      if (validInputValues.includes(key)) {
        const match = key.match(/\.(.+)/);
        let formattedText = ''
        if (match) {
          const capturedText = match[1];
          formattedText = capturedText.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        } else {
          formattedText = this.outputs.operation.inputs[key]['name']
        }

        let value = this.outputs[key]
        const inputType = this.outputs.operation.inputs[key]['spec']['attribute_type'];
        if(this.fileTypes.includes(inputType)){
          let query = `${this.API_URL}/resources/${value}/`
          this.httpClient.get(query).subscribe(res => {
            this.inputList[formattedText] = res['name']
          }),
            (error) => {
              console.error(`Error for ${key}: `, error);
              this.inputList[formattedText] = value
            }
        } else if(inputType === 'ObservationSet') {
          this.inputList[formattedText] = value['name'] + " (" + value['elements'].length + " Samples)"
        }
        else if(inputType === 'FeatureSet') {
          this.inputList[formattedText] = value['name'] + " (" + value['elements'].length + " Features)"

        }  
        else {
          this.inputList[formattedText] = value
        }

      }
    }
  }

  openInputDetailsDialog() {
    const dialogRef = this.dialog.open(InputInfoDialogComponent, {
      data: this.inputList
    });
  }

}