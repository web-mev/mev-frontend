import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Inject
} from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { AnalysesService } from '@app/features/analysis/services/analysis.service';
import { CustomSetType } from '@app/_models/metadata';
import { Utils } from '@app/shared/utils/utils';

/**
 * Add Annotation Dialog Component
 *
 * Modal dialog component which is used to incorporate an annotation file as custom observation set.
 */
@Component({
  selector: 'mev-add-annotation-dialog',
  templateUrl: './add-annotation-dialog.component.html',
  styleUrls: ['./add-annotation-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddAnnotationDialogComponent implements OnInit {
  files = [];
  attributes = [];
  selectedAnnotationFileId: string;
  annotationFileContent = [];
  selectedAttribute: string;
  attributeValues = [];
  selectedAttributeValues = [];
  form: FormGroup;

  dropdownSettings = {};
  constructor(
    private formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<AddAnnotationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private apiService: AnalysesService
  ) {}

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      annotation: ['', Validators.required],
      attribute: ['', Validators.required],
      attributeValue: ['', Validators.required]
    });

    this.dropdownSettings = {
      primaryKey: 'name',
      text: 'Select custom observation sets to create',
      selectAllText: 'Select All',
      unSelectAllText: 'Unselect All',
      classes: 'resource-dropdown',
      tagToBody: false
    };

    this.files = this.data.workspaceResources;
  }

  /**
   * Method is triggered when the user selects an annotation file from the dropdown list
   *
   * Get the annotation file content to get the list of attributes
   */
  onSelectAnnonation() {
    this.apiService
      .getResourceContent(this.selectedAnnotationFileId)
      .subscribe(response => {
        if (response.length) {
          this.annotationFileContent = response;
          this.attributes = Object.keys(response[0].values);
          this.selectedAttributeValues = []; // reset selected attributes in multi-select dropdown
        }
      });
  }

  /**
   * Method is triggered when the user select an attribure from the annotation file
   *
   * Get the list of unique attribute values
   */
  onSelectAttribute() {
    this.attributeValues = [
      ...new Set(
        this.annotationFileContent.map(
          item => item.values[this.selectedAttribute]
        )
      )
    ].map(el => ({ name: el }));
  }

  /**
   * Function is triggered when user clicks the Cancel button
   *
   */
  onNoClick(): void {
    this.dialogRef.close();
  }

  submit() {
    // empty stuff
  }

  /**
   * Function is triggered when user clicks the Add button
   *
   */
  confirmAdd() {
    const customSets = [];
    this.form.value.attributeValue.forEach(attrValue => {
      const attrSamples = this.annotationFileContent
        .filter(
          sample => sample.values[this.selectedAttribute] === attrValue.name
        )
        .map(sample => ({ id: sample.rowname, attributes: sample.values }));

      const customSet = {
        name: attrValue.name,
        type: CustomSetType.ObservationSet,
        elements: attrSamples,
        color: Utils.getRandomColor(),
        multiple: true
      };
      customSets.push(customSet);
    });
    this.dialogRef.close(customSets);
  }
}
