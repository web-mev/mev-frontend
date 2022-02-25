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
  
  // these are a bit redundant, but we keep the button hidden
  // PLUS make it inactive based on these booleans.
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
  this.isWait = false;
  this.showValueTypes = false;
}

  /**
   * Executed when an annotation file is chosen
   */
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
          this.annotationFileContent = response;
          this.attributes = Object.keys(response[0].values);
        }
      });
  }

  /**
   * Executed when one of the annotation fields is selected
   */
  onSelectAttribute() {
    this.selectedValueType = '';
    this.updateDisplayButton();
    this.form.controls['valueType'].setValue('');
    this.showValueTypes = true;

  }

  /**
   * When the radio button changes to toggle between the continuous
   * and categorical display
   */
  onValueTypeChange(event: MatRadioChange) {
    this.selectedValueType = event.value;
    if (this.selectedValueType.length > 0) {
      this.displayButtonActive = true;
    }
    this.dataIsDisplayed = false;
    this.updateDisplayButton();
  }

  /**
   * This function contains logic which controls both the 
   * active/inactive status and the text inside the button
   */
  updateDisplayButton(): void {
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

  /**
   * After all the selections have been made the button is clicked,
   * this prepares the data to be sent to the child component
   * which handles the display of the data
   */
  showTheData(){

    let selectedData = [];
    for(let item of this.annotationFileContent){
      selectedData.push(
        {
          id: item.rowname !== null ? item.rowname : '(none)',
          val: item.values[this.selectedAttribute] !== null ? item.values[this.selectedAttribute] : '(none)'
        }
      );
    }
    this.attributeData = selectedData;
    this.dataIsDisplayed = true;
  }

}
