import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';

import { AnalysesService } from '@app/features/analysis/services/analysis.service';

import { MatRadioChange } from '@angular/material/radio';
import { MatSelectChange } from '@angular/material/select';

import * as d3 from 'd3';


@Component({
  selector: 'mev-annotations',
  templateUrl: './annotations.component.html',
  styleUrls: ['./annotations.component.scss']
})
export class AnnotationComponent implements OnInit {

  @Input() workspaceResources = [];
  form: FormGroup;
  selectedAnnotationFileId: string;
  selectedAttribute: string;
  selectedValueType: string;
  files = [];
  attributes = [];

  isWait: boolean;

  CONTINUOUS = 'Continuous';
  FACTOR = 'Categorical';
  VALUE_TYPES = [this.CONTINUOUS, this.FACTOR];
  showValueTypes: boolean;
  
  displayButtonVisible = false;
  displayButtonActive = false;
  displayButtonText = 'DEFAULT';

  dataIsDisplayed = false;

  annotationFileContent;
  attributeData;

  continuousVersusFactorDesc = 'We can treat the data as continuous/numeric or as a finite number of discrete "categories". \
    An example of continuous/numeric would be age or weight. Categorical data includes tumor staging, ethnicity, or similar. \
    For numerical data, we allow you to manually define "bins" to stratify your samples.';

  constructor(
    private formBuilder: FormBuilder,
    private apiService: AnalysesService
    ) { }


  
ngOnInit(): void {
  this.form = this.formBuilder.group({
    annotation: [''],
    attribute: [''],
    valueType: ['']
  });
  this.files = this.workspaceResources;
  console.log('init of ann component: ', this.workspaceResources)
  this.isWait = false;
  this.showValueTypes = false;
}

onSelectAnnotationFile() {

  // reset values so the lower fields aren't stale
  this.showValueTypes = false;
  this.selectedValueType = '';
  this.selectedAttribute = '';
  this.form.controls['attribute'].setValue('');
  this.form.controls['valueType'].setValue('');
  this.updateDisplayButton();

  // fetch the attributes of this file:
  this.isWait = true;
  this.apiService
  .getResourceContent(this.selectedAnnotationFileId)
  .subscribe(response => {
    this.isWait = false;
    if (response.length) {
      // api will respond with an array of items like:
//   {
//     "rowname": "b3054bf3-4d49-53a1-a77c-f22965f9d4fb",
//     "values": {
//         "ethnicity": "not hispanic or latino",
//         "gender": "female",
//         "race": "white",
//         "vital_status": "Dead",
//         "age_at_diagnosis": 1064.0,
//         "days_to_last_follow_up": 659.0,
//         "inss_stage": "Stage 4",
//         "last_known_disease_status": "not reported",
//         "morphology": "9500/3",
//         "primary_diagnosis": "Neuroblastoma, NOS",
//         "progression_or_recurrence": "not reported",
//         "site_of_resection_or_biopsy": "Not Reported",
//         "tissue_or_organ_of_origin": "Kidney, NOS",
//         "tumor_grade": "Not Reported",
//         "year_of_diagnosis": 2004.0,
//         "dbgap_accession_number": "phs000467",
//         "disease_type": "Neuroblastoma",
//         "name": "Neuroblastoma",
//         "primary_site": "Nervous System",
//         "project_id": "TARGET-NBL",
//         "case_id": "e88037ef-beb8-5874-a175-ae5fa9bf8ebb"
//     }
// }
      this.annotationFileContent = response;
      this.attributes = Object.keys(response[0].values);
    }
  });
}

  onSelectAttribute() {
    console.log('Selected:', this.selectedAttribute);
    this.selectedValueType = '';
    this.updateDisplayButton();
    this.form.controls['valueType'].setValue('');
    this.showValueTypes = true;

  }

  onValueTypeChange(event: MatRadioChange) {
    this.selectedValueType = event.value;
    console.log(`radio changed to ${this.selectedValueType}`);
    if (this.selectedValueType.length > 0) {
      this.displayButtonActive = true;
    }
    this.dataIsDisplayed = false;
    this.updateDisplayButton();
  }

  updateDisplayButton(): void {
    console.log('update bn');

    let hasFile = this.selectedAnnotationFileId.length > 0;
    let attrChosen = this.selectedAttribute ? this.selectedAttribute.length > 0 : false;
    let hasValueTypeSelected = this.selectedValueType? this.selectedValueType.length > 0 : false;
    if (hasFile && attrChosen && hasValueTypeSelected){
      this.displayButtonActive = true;
      this.displayButtonVisible = true;
      this.displayButtonText = `Display ${this.selectedAttribute} as ${this.selectedValueType.toLowerCase()}`;
    } else {
      this.displayButtonActive = false;
      this.displayButtonVisible = false;
      this.dataIsDisplayed = false;
    }

  }

  showTheData(){
    console.log('go show!');

    let selectedData = [];
    for(let item of this.annotationFileContent){
      selectedData.push(
        {
          id: item.rowname,
          val: item.values[this.selectedAttribute]
        }
      );
    }
    this.attributeData = selectedData;
    this.dataIsDisplayed = true;
  }

}
