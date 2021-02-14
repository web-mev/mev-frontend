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

  boxPlotData;

  constructor(
    private formBuilder: FormBuilder,
    private apiService: AnalysesService,
    private metadataService: MetadataService,
    public dialog: MatDialog
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
          case 'OptionString': {
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

    controlsConfig['job_name'] = [
      '',
      [...(this.operation.mode !== 'client' ? [Validators.required] : [])]
    ];
    this.analysesForm = this.formBuilder.group(controlsConfig);
  }

  /**
   * Load operation data before creating form controls
   */
  loadData() {
    if (this.operation.mode === 'client') {
      this.createForm(this.operation);
    } else {
      this.apiService.getOperation(this.operation.id).subscribe(data => {
        this.createForm(data);
      });
    }
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
   * Function is triggered when the user clicks the Run button
   * to start analysis
   */
  startAnalysis() {
    const inputs = this.convertToFloatObj(this.analysesForm.value);
    this.apiService
      .executeOperation(this.operation.id, this.workspaceId, inputs)
      .subscribe(data => {
        this.executedOperationId.emit(data.executed_operation_id);
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
