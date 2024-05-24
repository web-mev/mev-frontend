import { Component, ChangeDetectionStrategy, Output, EventEmitter, Input, OnInit } from '@angular/core';
import { FormGroup, Validators, FormBuilder, AbstractControl, AbstractControlOptions, ValidationErrors, ValidatorFn } from '@angular/forms';
import { AnalysesService } from '../../services/analysis.service';
import { BaseOperationInput } from '../base-operation-inputs/base-operation-inputs';
import { MetadataService } from '@app/core/metadata/metadata.service';


const observationSetsValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const raw_counts_ctrl = control.get('raw_counts');
    const obs_set_ctrl = control.get('expSamples');
    const obs_set_ctrl2 = control.get('baseSamples');
    const expGroupName_ctrl = control.get('expGroupName');
    const baseGroupName_ctrl = control.get('baseGroupName');
    const obs_set = obs_set_ctrl.value;
    const obs_set2 = obs_set_ctrl2.value;
    if (obs_set) {
        raw_counts_ctrl.setErrors(null);
        raw_counts_ctrl.markAsTouched();
        expGroupName_ctrl.setErrors(expGroupName_ctrl.errors);
        expGroupName_ctrl.markAsTouched();
    }
    if (obs_set2) {
        baseGroupName_ctrl.setErrors(baseGroupName_ctrl.errors);
        baseGroupName_ctrl.markAsTouched();
    }
    return null;
}

const observationSetsValidatorBiomarker: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const raw_counts_ctrl = control.get('raw_counts');
    const obs_set_ctrl = control.get('expSamples');
    const expGroupName_ctrl = control.get('expGroupName');
    const obs_set = obs_set_ctrl.value;
    if (obs_set) {
        raw_counts_ctrl.setErrors(null);
        raw_counts_ctrl.markAsTouched();
        expGroupName_ctrl.setErrors(expGroupName_ctrl.errors);
        expGroupName_ctrl.markAsTouched();
    }
    return null;
}

@Component({
    selector: 'sctk-mast-input',
    templateUrl: './sctk-mast-input.component.html',
    styleUrls: ['./sctk-mast-input.component.scss'],
    providers: [{ provide: BaseOperationInput, useExisting: SCTKMastInputComponent }],
    changeDetection: ChangeDetectionStrategy.Default
})
export class SCTKMastInputComponent extends BaseOperationInput implements OnInit {
    analysesForm: FormGroup;
    submitted = false;

    @Input() operationData: any;
    @Input() workspaceId: string;
    @Output() formValid: EventEmitter<any> = new EventEmitter<any>();

    countMatrixField;
    expGroupNameField;
    baseGroupNameField;
    obsSetField;
    obsSetField2;
    matrixSamples = [];

    analysisType: string = 'direct_comparison';
    controlsConfig = {};
    controlsConfig2 = {};
    controlsConfigDefault = {};

    constructor(
        private apiService: AnalysesService,
        private formBuilder: FormBuilder,
        private metadataService: MetadataService
    ) {
        super();
    }

    ngOnInit(): void {
        if (this.operationData) {
            this.createForm();
            this.analysesForm.statusChanges.subscribe(() => {
                this.onFormValid()
            });
        }
    }

    public onFormValid() {
        this.formValid.emit(this.analysesForm.valid);
    }

    createForm() {
        let controlsConfigDefault = {};
        controlsConfigDefault = this.analysisType === 'direct_comparison' ? this.controlsConfig : this.controlsConfig2
        let input;

        controlsConfigDefault['job_name'] = [(this.analysesForm !== undefined && this.analysesForm.value['job_name'] ? this.analysesForm.value['job_name'] : ''), [Validators.required]];
        controlsConfigDefault['analysisType'] = [this.analysisType, []];

        let key = "raw_counts"
        input = this.operationData.inputs[key];
        this.countMatrixField = {
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
                this.countMatrixField.files = data;
            });

        const configResourceField = [(this.analysesForm !== undefined && this.analysesForm.value[key] ? this.analysesForm.value[key] : ''), []];
        controlsConfigDefault[key] = configResourceField;

        key = 'expGroupName';
        input = this.operationData.inputs[key];
        this.expGroupNameField = {
            key: key,
            name: input.name,
            min: 1,
            desc: input.description,
            required: input.required
        };

        const configExpGroupNameField = [
            (this.analysesForm !== undefined && this.analysesForm.value[key] ? this.analysesForm.value[key] : input.spec.default_value),
            [
                ...(input.required ? [Validators.required] : []),
                Validators.min(1),
            ]
        ];
        controlsConfigDefault[key] = configExpGroupNameField;

        key = 'baseGroupName';
        input = this.operationData.inputs[key];
        this.baseGroupNameField = {
            key: key,
            name: input.name,
            desc: input.description,
            required: this.analysisType === 'direct_comparison' ? input.required : false
        };
        const baseGroupDefaultValue = this.analysisType === 'direct_comparison' ? (this.analysesForm === undefined ? input.spec.default_value : (this.analysesForm.value.baseGroupName === 'na' ? ' ' : this.analysesForm.value.baseGroupName)) : 'na';
        const configBaseGroupNameField = [baseGroupDefaultValue,
            [...(this.baseGroupNameField.required && this.analysisType === 'direct_comparison' ? [Validators.required] : []),
            ]
        ];
        controlsConfigDefault[key] = configBaseGroupNameField;

        const availableObsSets = this.metadataService.getCustomObservationSets().map(set => {
            const newSet = set.elements.map(elem => {
                const o = { id: elem.id };
                return o;
            });
            return { ...set, elements: newSet };
        });
        key = 'expSamples'
        input = this.operationData.inputs[key];
        this.obsSetField = {
            key: key,
            name: input.name,
            desc: input.description,
            required: input.required,
            sets: availableObsSets
        };
        const configObsSetsField = [
            undefined,
            [...(input.required ? [Validators.required] : [])]
        ];
        controlsConfigDefault[key] = configObsSetsField;

        key = 'baseSamples'
        input = this.operationData.inputs[key];
        this.obsSetField2 = {
            key: key,
            name: input.name,
            desc: input.description,
            required: this.analysisType === 'direct_comparison' ? input.required : false,
            sets: availableObsSets
        };

        const configObsSetsField2 = [
            undefined,
            [...(input.required && this.analysisType === 'direct_comparison' ? [Validators.required] : [])]
        ];

        if (this.analysisType === 'direct_comparison') {
            controlsConfigDefault[key] = configObsSetsField2;
        }
        console.log("control: ", controlsConfigDefault)

        this.analysesForm = this.formBuilder.group(controlsConfigDefault,
            {
                validators: this.analysisType === 'direct_comparison' ? [observationSetsValidator] : [observationSetsValidatorBiomarker],
                updateOn: 'change'
            } as AbstractControlOptions);

    }


    getInputData(): any {
        return this.analysesForm.value;
    }

    /**
     * Convenience getter for easy access to form fields
     */
    get f() {
        return this.analysesForm.controls;
    }

    onSubmit() {
        this.submitted = true;
    }

    analysisTypeChange() {
        this.analysisType = this.analysesForm.value.analysisType
        console.log("analysesForm: ", this.analysesForm)

        this.createForm();
        this.onFormValid();
        this.analysesForm.statusChanges.subscribe(() => {
            this.onFormValid()
        });
    }
}