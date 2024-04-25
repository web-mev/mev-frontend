import {
  Component,
  ChangeDetectionStrategy,
  OnChanges,
  Output,
  EventEmitter,
  Input
} from '@angular/core';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { AnalysesService } from '../../services/analysis.service';
import { MetadataService } from '@app/core/metadata/metadata.service';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from '@core/notifications/notification.service';
import { BaseOperationInput } from '../base-operation-inputs/base-operation-inputs';

/**
 * Used to display interactive inputs for a differential expression 
 * style analysis
 */
@Component({
  selector: 'differential-expression-input',
  templateUrl: './differential-expression-input.component.html',
  styleUrls: ['./differential-expression-input.component.scss'],
  providers: [{ provide: BaseOperationInput, useExisting: DifferentialExpressionInputComponent }],
  changeDetection: ChangeDetectionStrategy.Default
})
export class DifferentialExpressionInputComponent extends BaseOperationInput implements OnChanges {
  analysesForm: FormGroup;
  submitted = false;
  @Input() operationData: any;
  @Input() workspaceId: string;
  @Output() formValid: EventEmitter<any> = new EventEmitter<any>();

  rawCountsField;

  constructor(
    private formBuilder: FormBuilder,
    private apiService: AnalysesService,
    private metadataService: MetadataService,
    public dialog: MatDialog,
    private readonly notificationService: NotificationService
  ) {
    super();
  }

  ngOnChanges(): void {
    if (this.operationData) {
      this.createForm();
      this.analysesForm.statusChanges.subscribe(() => this.onFormValid());
    }
  }

  getInputData(): any {
    let inputs = this.convertToFloatObj(this.analysesForm.value);
    return inputs;
  }

  onSubmit() {
    this.submitted = true;
  }

  public onFormValid() {
    this.formValid.emit(this.analysesForm.valid);
  }

  createForm() {
    const controlsConfig = {};
    let input;

    // the job name field:
    controlsConfig['job_name'] = ['', [Validators.required]];

    // the selection for the raw counts:
    let key = "raw_counts"
    input = this.operationData.inputs[key];
    console.log(input);
    this.rawCountsField = {
      key: key,
      name: input.name,
      resource_types: input.spec.resource_types,
      desc: input.description,
      required: input.required,
      files: [],
      selectedFiles: []
    };
    this.apiService
      .getWorkspaceResourcesByParam(
        input.spec.resource_types,
        this.workspaceId
      )
      .subscribe(data => {
        this.rawCountsField.files = data;
      });

    const configResourceField = [
      '',
      [...(input.required ? [Validators.required] : [])]
    ];
    controlsConfig[key] = configResourceField;
    this.analysesForm = this.formBuilder.group(controlsConfig);
  }

  /**
    * Convenience getter for easy access to form fields
    */
    get f() {
    return this.analysesForm.controls;
  }

  /**
    * Function is used to convert strings to floats for numeric values
    * before sending the data to execute the operation
    */
  convertToFloatObj(obj) {
      const res = {};
      for (const key in obj) {
          res[key] =
              isNaN(obj[key]) || typeof obj[key] === 'boolean'
                  ? obj[key]
                  : parseFloat(obj[key]);
      }
      return res;
  }
}