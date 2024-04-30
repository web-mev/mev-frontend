import {
    Component,
    ChangeDetectionStrategy,
    OnChanges,
    Output,
    EventEmitter,
    Input
} from '@angular/core';
import { Observable, of } from 'rxjs';
import { FormGroup, Validators, FormBuilder, AbstractControl, AbstractControlOptions, ValidationErrors, ValidatorFn, AsyncValidatorFn } from '@angular/forms';
import { AnalysesService } from '../../services/analysis.service';
import { MetadataService } from '@app/core/metadata/metadata.service';
import { MatDialog } from '@angular/material/dialog';
import { BaseOperationInput } from '../base-operation-inputs/base-operation-inputs';
import { CompatibleObsSetService } from '../../services/compatible_obs_set.service';


// checks that the chosen observation sets are 1) not the same and 2) have no intersection
const intersectingObservationSetsValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const obs_set_1_ctrl = control.get('base_condition_samples');
    const obs_set_2_ctrl = control.get('experimental_condition_samples');
    const obs_set_1 = obs_set_1_ctrl.value;
    const obs_set_2 = obs_set_2_ctrl.value;
    if (obs_set_1 && obs_set_2) {

        if (obs_set_1.name === obs_set_2.name) {
            return { sameName: true }
        }

        const v1 = obs_set_1.elements.map(item => {
            return item.id;
        });
        const v2 = obs_set_2.elements.map(item => {
            return item.id;
        })
        const elements_1 = new Set(v1);
        const elements_2 = new Set(v2);
        let intersection = [];
        for (const v of elements_1) {
            if (elements_2.has(v)) {
                intersection.push(v)
            }
        }
        if (intersection.length > 0) {
            return { intersection: intersection }
        } else {
            return null;
        }
    } else {
        return null;
    }
};

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
    ctrlObsSetField;
    experimentalObsSetField;
    baseConditionNameField;
    experimentalConditionNameField;
    rawCountsSamples = [];

    constructor(
        private formBuilder: FormBuilder,
        private apiService: AnalysesService,
        private metadataService: MetadataService,
        public dialog: MatDialog,
        private obsSetService: CompatibleObsSetService
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
            [Validators.required]
        ];
        controlsConfig[key] = configResourceField;

        // add the observation sets. Note that the obs sets cannot contain
        // a non-null intersection.

        // get all the available obs sets
        const availableObsSets = this.metadataService.getCustomObservationSets().map(set => {
            const newSet = set.elements.map(elem => {
                const o = { id: elem.id };
                return o;
            });
            return { ...set, elements: newSet };
        });
        key = 'base_condition_samples'
        input = this.operationData.inputs[key];
        this.ctrlObsSetField = {
            key: key,
            name: input.name,
            desc: input.description,
            required: input.required,
            sets: availableObsSets
        };
        const configBaseObservationSetsField = [
            undefined,
            [...(input.required ? [Validators.required] : [])]
        ];
        controlsConfig[key] = configBaseObservationSetsField;

        key = 'experimental_condition_samples'
        input = this.operationData.inputs[key];
        this.experimentalObsSetField = {
            key: key,
            name: input.name,
            desc: input.description,
            required: input.required,
            sets: availableObsSets
        };
        const configExpObservationSetsField = [
            undefined,
            [...(input.required ? [Validators.required] : [])]
        ];
        controlsConfig[key] = configExpObservationSetsField;

        key = 'base_condition_name'
        input = this.operationData.inputs[key];
        this.baseConditionNameField = {
            key: key,
            name: input.name,
            desc: input.description,
            required: input.required
        };
        const configBaseConditionNameField = [
            '',
            [...(input.required ? [Validators.required] : [])]
        ];
        controlsConfig[key] = configBaseConditionNameField;

        key = 'experimental_condition_name'
        input = this.operationData.inputs[key];
        this.experimentalConditionNameField = {
            key: key,
            name: input.name,
            desc: input.description,
            required: input.required
        };
        const configExperimentalConditionNameField = [
            '',
            [...(input.required ? [Validators.required] : [])]
        ];
        controlsConfig[key] = configExperimentalConditionNameField;

        this.analysesForm = this.formBuilder.group(controlsConfig,
            {
                validators: [intersectingObservationSetsValidator],
                asyncValidators: [this.obsSetService.validate()]
            } as AbstractControlOptions
        );
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