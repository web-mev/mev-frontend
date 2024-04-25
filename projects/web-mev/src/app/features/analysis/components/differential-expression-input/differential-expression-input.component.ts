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
  @Output() formValid: EventEmitter<any> = new EventEmitter<any>();

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
    console.log('in dge component');
    console.log(this.operationData);
    if(this.operationData){
      this.createForm();
      this.analysesForm.statusChanges.subscribe(() => this.onFormValid());
  }
  }

  getInputData(): any {
    console.log('in getInputData of DGE class')
    return { 'dge_input_a': 'abc' };
  }
  
  onSubmit() {
    this.submitted = true;
  }

  public onFormValid() {
    this.formValid.emit(this.analysesForm.valid);
  }

  createForm(){
    const controlsConfig = {};
    controlsConfig['job_name'] = ['', [Validators.required]];
    this.analysesForm = this.formBuilder.group(controlsConfig);
  }

}

