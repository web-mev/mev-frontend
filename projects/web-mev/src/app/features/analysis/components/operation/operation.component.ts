import {
  Component,
  ChangeDetectionStrategy,
  Input,
  EventEmitter,
  Output,
  OnChanges,
  ViewChild
} from '@angular/core';
import { AnalysesService } from '../../services/analysis.service';
import { Workspace } from '@app/features/workspace-manager/models/workspace';
import { Observable } from 'rxjs';
import { Operation } from '../../models/operation';
import { BaseOperationInput } from '../base-operation-inputs/base-operation-inputs';
import { NotificationService } from '@core/notifications/notification.service';
/**
 * Operation Component
 * used for displaying the input parameters of an operation
 */
@Component({
  selector: 'mev-operation',
  templateUrl: './operation.component.html',
  styleUrls: ['./operation.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class OperationComponent implements OnChanges {
  submitted = false;
  formIsValid = false;

  @ViewChild(BaseOperationInput) opInput!: BaseOperationInput

  @Input() workspaceId: string;
  @Input() workspace$: Observable<Workspace>;
  @Input() operation: Operation;

  @Output() executedOperationId: EventEmitter<any> = new EventEmitter<any>();

  operationData;
  customInput;

  // Tools which have the same interface- in this case for basic differential expression. We use this
  // to generate the same custom child component
  differentialExpressionTools = ['DESeq2', 'edgeR', 'Limma/voom'];

  // a master list of the tools which have a custom implementation (not using the default form generator)
  // These are identified by the operation's name
  customTools = [...this.differentialExpressionTools,
    'K-means', 
    'Likelihood ratio test', 
    'MAST Single-cell differential expression', 
    'ComBat-seq',  
    'SNF (Similarity Network Fusion)',
    'spatialGE Spatial Gradient Testing (STgradient)',
    'spatialGE Spatial Autocorrelation (SThet)',
    'spatialGE normalization',
    'spatialGE pathway enrichment',
    'spatialGE clustering',
  ];

  constructor(
    private apiService: AnalysesService,
    private readonly notificationService: NotificationService
  ) { }

  ngOnChanges(): void {
    this.loadData();
  }

  /**
 * Load operation data before creating form controls
 */
  loadData() {
    this.apiService.getOperation(this.operation.id).subscribe(data => {
      this.operationData = data;
      console.log("operattion data: ", this.operationData)
      if (this.customTools.includes(this.operationData.name)) {
        this.customInput = true;
      } else {
        this.customInput = false;
      }
      this.formIsValid = false;
    });
  }

  public showExecutedOperationResult(data: any) {
    this.executedOperationId.emit(data);
  }

  public alterFormStatus(isValid: boolean) {
    this.formIsValid = isValid;
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

  startAnalysis() {
    
    let inputs = this.opInput.getInputData();
    inputs = this.convertToFloatObj(inputs);


    this.apiService
      .executeOperation(this.operation.id, this.workspaceId, inputs)
      .subscribe(data => {
        this.executedOperationId.emit(data.executed_operation_id);
      },
        error => {
          // One of the inputs was invalid-- parse the error and combine
          // with the input information to give a reasonable description of the error

          // This lets us tie the particular error to a "human-readable" input field.
          // Otherwise the error text would be a bit cryptic for the end user.
          console.log("error: ", error)
          let op_inputs = this.operation.inputs;
          let err_obj = error.error;
          let input_errors = err_obj.inputs;
          let err_msg = '';
          for (let input_key of Object.keys(input_errors)) {
            let s = input_errors[input_key];
            let field_name = op_inputs[input_key].name;
            err_msg += `${field_name} ${s}`;
            err_msg += '\n'
          }
          this.notificationService.error(err_msg);
        });
  }

}