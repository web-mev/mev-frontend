import {
  Component,
  ChangeDetectionStrategy,
  Input,
  EventEmitter,
  Output,
  OnChanges
} from '@angular/core';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { AnalysesService } from '../../services/analysis.service';
import { Workspace } from '@app/features/workspace-manager/models/workspace';
import { Observable } from 'rxjs';
import { Operation } from '../../models/operation';
import { MetadataService } from '@app/core/metadata/metadata.service';
import { AnalysisPlottingResultComponent } from '../analysis-plotting-result/analysis-plotting-result.component';
import { MatDialog } from '@angular/material/dialog';
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
  analysesForm: FormGroup;
  submitted = false;
  multipleResourcesDropdownSettings = {};

  @Input() workspaceId: string;
  @Input() workspace$: Observable<Workspace>;
  @Input() operation: Operation;

  @Output() executedOperationId: EventEmitter<any> = new EventEmitter<any>();

  // default settings for analyses fields
  numFields = [];
  intFields = [];
  resourceFields = [];
  multipleResourceFields = [];
  textFields = [];
  optionFields = [];
  booleanFields = [];
  observationFields = [];
  featureFields = [];

  operationData;

  boxPlotData;

  constructor(
    private formBuilder: FormBuilder,
    private apiService: AnalysesService,
    private metadataService: MetadataService,
    public dialog: MatDialog,
    private readonly notificationService: NotificationService
  ) {
    this.multipleResourcesDropdownSettings = {
      text: '',
      selectAllText: 'Select All',
      unSelectAllText: 'Unselect All',
      classes: 'resource-dropdown'
    };
  }

  ngOnChanges(): void {
    this.loadData();
  }

  /**
   * Configure the control setting for different types of input operation parameters
   * The supported types are ObservationSet, FeatureSet, DataResource, BoundedFloat, Integer,
   * Positive Integer, String, OptionString
   */
  createForm(data) {
    const inputs = data.inputs;
    const controlsConfig = {};
    this.numFields = [];
    this.intFields = [];
    this.resourceFields = [];
    this.multipleResourceFields = [];
    this.textFields = [];
    this.booleanFields = [];
    this.optionFields = [];
    this.observationFields = [];
    this.featureFields = [];

    for (const key in inputs) {
      if (inputs.hasOwnProperty(key)) {
        const input = inputs[key];
        const field_type = input.spec.attribute_type;

        switch (field_type) {
          case 'ObservationSet': {
            const observationField = {
              key: key,
              name: input.name,
              desc: input.description,
              required: input.required,
              sets: []
            };
            const availableObsSets = this.metadataService.getCustomObservationSets();
            observationField.sets = availableObsSets.map(set => {
              const newSet = set.elements.map(elem => {
                const o = { id: elem.id };
                return o;
              });
              return { ...set, elements: newSet };
            });
            this.observationFields.push(observationField);
            const configObservationSetsField = [
              '',
              [...(input.required ? [Validators.required] : [])]
            ];
            controlsConfig[key] = configObservationSetsField;
            break;
          }
          case 'FeatureSet': {
            const featureField = {
              key: key,
              name: input.name,
              desc: input.description,
              required: input.required,
              sets: []
            };
            const availableFeatSets = this.metadataService.getCustomFeatureSets();
            featureField.sets = availableFeatSets.map(set => {
              const newSet = set.elements.map(elem => {
                const o = { id: elem.id };
                return o;
              });
              return { ...set, elements: newSet };
            });
            this.featureFields.push(featureField);
            const configFeatureSetsField = [
              '',
              [...(input.required ? [Validators.required] : [])]
            ];
            controlsConfig[key] = configFeatureSetsField;
            break;
          }
          case 'DataResource': {
            const resourceField = {
              key: key,
              name: input.name,
              resource_type: input.spec.resource_type,
              desc: input.description,
              required: input.required,
              files: [],
              selectedFiles: []
            };

            this.apiService
              .getAvailableResourcesByParam(
                // the first arg requires a list of potential 
                // resource types. Since a DataResource has its 
                // input fixed to a particular type, then we 
                // put it inside a list here.
                [input.spec.resource_type],
                this.workspaceId
              )
              .subscribe(data => {
                resourceField.files = data;
                if (input.spec.many === false) {
                  this.resourceFields.push(resourceField);
                } else {
                  this.multipleResourceFields.push(resourceField);
                }
              });

            const configResourceField = [
              '',
              [...(input.required ? [Validators.required] : [])]
            ];
            controlsConfig[key] = configResourceField;
            break;
          }
          case 'VariableDataResource': {
            const resourceField = {
              key: key,
              name: input.name,
              resource_types: input.spec.resource_types,
              desc: input.description,
              required: input.required,
              files: [],
              selectedFiles: []
            };
            this.apiService
              .getAvailableResourcesByParam(
                input.spec.resource_types,
                this.workspaceId
              )
              .subscribe(data => {
                resourceField.files = data;
                if (input.spec.many === false) {
                  this.resourceFields.push(resourceField);
                } else {
                  this.multipleResourceFields.push(resourceField);
                }
              });

            const configResourceField = [
              '',
              [...(input.required ? [Validators.required] : [])]
            ];
            controlsConfig[key] = configResourceField;
            break;
          }
          case 'BoundedFloat': {
            const numField = {
              key: key,
              name: input.name,
              min: input.spec.min,
              max: input.spec.max,
              desc: input.description,
              required: input.required
            };
            this.numFields.push(numField);

            const configNumField = [
              input.spec.default_value,
              [
                ...(input.required ? [Validators.required] : []),
                Validators.min(input.spec.min),
                Validators.max(input.spec.max),
                Validators.pattern(/^-?\d*(\.\d+)?$/)
              ]
            ];
            controlsConfig[key] = configNumField;
            break;
          }
          case 'Integer': {
            const intField = {
              key: key,
              name: input.name,
              min: 0,
              desc: input.description,
              required: input.required
            };
            this.intFields.push(intField);

            const configIntField = [
              input.spec.default_value,
              [
                ...(input.required ? [Validators.required] : []),
                Validators.min(input.spec.min),
                Validators.pattern(/^[0-9]\d*$/)
              ]
            ];
            controlsConfig[key] = configIntField;
            break;
          }
          case 'PositiveInteger': {
            const posIntField = {
              key: key,
              name: input.name,
              min: 1,
              desc: input.description,
              required: input.required
            };
            this.intFields.push(posIntField);

            const configPosIntField = [
              input.spec.default_value,
              [
                ...(input.required ? [Validators.required] : []),
                Validators.min(input.spec.min),
                Validators.pattern(/^[1-9]\d*$/)
              ]
            ];
            controlsConfig[key] = configPosIntField;
            break;
          }
          case 'BoundedInteger': {
            const boundedIntField = {
              key: key,
              name: input.name,
              min: input.spec.min,
              max: input.spec.max,
              desc: input.description,
              required: input.required
            };
            this.intFields.push(boundedIntField);

            const configBoundedIntField = [
              input.spec.default_value,
              [
                ...(input.required ? [Validators.required] : []),
                Validators.min(input.spec.min),
                Validators.max(input.spec.max),
                Validators.pattern(/^[0-9]\d*$/)
              ]
            ];
            controlsConfig[key] = configBoundedIntField;
            break;
          }

          case 'String': {
            const textField = {
              key: key,
              name: input.name,
              desc: input.description,
              required: input.required
            };
            this.textFields.push(textField);

            const configTextField = [
              input.spec.default_value,
              [...(input.required ? [Validators.required] : [])]
            ];
            controlsConfig[key] = configTextField;
            break;
          }
          case ['OptionString', 'IntegerOption', 'FloatOption'].find( x => x === field_type): {
            const optionField = {
              key: key,
              name: input.name,
              desc: input.description,
              required: input.required,
              options: input.spec.options,
              selectedOptions: []
            };
            this.optionFields.push(optionField);
            const configOptionField = [
              input.spec.default_value,
              [...(input.required ? [Validators.required] : [])]
            ];
            controlsConfig[key] = configOptionField;
            break;
          }
          case 'Boolean': {
            const booleanField = {
              key: key,
              name: input.name,
              desc: input.description,
              required: input.required
            };
            this.booleanFields.push(booleanField);

            const configBooleanField = [
              input.spec.default_value,
              [...(input.required ? [Validators.required] : [])]
            ];
            controlsConfig[key] = configBooleanField;
            break;
          }
          default: {
            break;
          }
        }
      }
    }

    controlsConfig['job_name'] = ['', [Validators.required]];
    this.analysesForm = this.formBuilder.group(controlsConfig);
  }

  /**
   * Load operation data before creating form controls
   */
  loadData() {
    this.apiService.getOperation(this.operation.id).subscribe(data => {
      // console.log("load data: ", data)
      this.createForm(data);
      this.operationData = data;
    });
  }

  onSubmit() {
    this.submitted = true;
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

  /**
   * This modifies the form payload (which is ultimately
   * sent to the server) to correctly represent input fields
   * where we can accept multiple resources/files. 
   * 
   * In the case of a single resource, the input element 
   * (a select) correctly sets the form value as the resource's
   * primary key. When we use the multiselect element, there's no
   * way to get a simple list of UUIDs for the files. Hence,
   * we use this function to do that.
   */
  handleResourceMultiSelect(userInputData) {

    // need the consult the operation specification:
    const inputs = this.operationData.inputs;
    let updatedInputData = {};

    // iterate through the data obtained from the form.
    // Note that the form can contain items that are not
    // part of the operation spec (e.g. the job name)
    for (const key in userInputData) {
      if (userInputData.hasOwnProperty(key)) {

        // if this element corresponds to an input from
        // the operation specification, we need to dig deeper
        if (inputs.hasOwnProperty(key)) {
          let input = inputs[key];
          let field_type = input.spec.attribute_type;

          // if this particular input corresponds to a file AND allows
          // multiple selections:
          let condition1 = (field_type === 'DataResource') || (field_type === 'VariableDataResource');
          let condition2 = (input.spec.many === true)
          let is_multiselect = (condition1 && condition2);
          if (is_multiselect) {
            // iterate through the objects and extract out the primary
            // key of the resource:
            updatedInputData[key] = userInputData[key].map(
              z => z['id']
            );
          }
          else {
            // the input was not file-related or only allowed a single
            // file. simply copy over 
            updatedInputData[key] = userInputData[key];
          }
        } else {
          // if we are here, we have a form value that did NOT
          // correspond to an input in the operation spec.
          // Simply copy it over
          updatedInputData[key] = userInputData[key];
        }
      }
    }
    return updatedInputData;
  }

  /**
   * Function is triggered when the user clicks the Run button
   * to start analysis
   */
  startAnalysis() {
    let inputs = this.convertToFloatObj(this.analysesForm.value);
    inputs = this.handleResourceMultiSelect(inputs);

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

  /**
   * Function is triggered when the user clicks the Show button
   * to visualize normalization results
   */
  showPlots() {
    const inputs = this.convertToFloatObj(this.analysesForm.value);
    this.boxPlotData = { ...inputs };

    this.dialog.open(AnalysisPlottingResultComponent, {
      data: {
        boxPlotData: { ...inputs }
      }
    });
  }

  /**
   * Convenience getter for easy access to form fields
   */
  get f() {
    return this.analysesForm.controls;
  }
}