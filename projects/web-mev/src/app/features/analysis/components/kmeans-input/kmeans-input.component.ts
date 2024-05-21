import { Component, ChangeDetectionStrategy, OnChanges, Output, EventEmitter, Input } from '@angular/core';
import { FormGroup, Validators, FormBuilder, AbstractControl, AbstractControlOptions, ValidationErrors, ValidatorFn } from '@angular/forms';
import { AnalysesService } from '../../services/analysis.service';
import { BaseOperationInput } from '../base-operation-inputs/base-operation-inputs';
import { MetadataService } from '@app/core/metadata/metadata.service';
import { CompatibleObsSetService } from '../../services/compatible_obs_set.service';
import { FileService } from '@file-manager/services/file-manager.service';

const observationSetsValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const mtx_ctrl = control.get('input_matrix');
    const obs_set_ctrl = control.get('samples');
    const num_clusters_ctrl = control.get('num_clusters');
    const obs_set = obs_set_ctrl.value;
    if (obs_set) {
        mtx_ctrl.setErrors(null);
        mtx_ctrl.markAsTouched();
        num_clusters_ctrl.setErrors(null);
        num_clusters_ctrl.markAsTouched();
    }
    return null;
}

@Component({
    selector: 'kmeans-input',
    templateUrl: './kmeans-input.component.html',
    styleUrls: ['./kmeans-input.component.scss'],
    providers: [{ provide: BaseOperationInput, useExisting: KmeansInputComponent }],
    changeDetection: ChangeDetectionStrategy.Default
})
export class KmeansInputComponent extends BaseOperationInput implements OnChanges {
    analysesForm: FormGroup;
    submitted = false;

    @Input() operationData: any;
    @Input() workspaceId: string;
    @Output() formValid: EventEmitter<any> = new EventEmitter<any>();

    inputMatrixField;
    numClustersField;
    numIterField;
    dimensionField;
    obsSetField;
    featureSetField;
    matrixSamples = [];

    constructor(
        private apiService: AnalysesService,
        private formBuilder: FormBuilder,
        private metadataService: MetadataService,
        private obsSetService: CompatibleObsSetService,
        private fileService: FileService
    ) {
        super();
    }

    ngOnChanges(): void {
        if (this.operationData) {
            this.createForm();
            this.analysesForm.statusChanges.subscribe(() => this.onFormValid());
        }
    }

    public onFormValid() {
        this.formValid.emit(this.analysesForm.valid);
    }

    createForm() {
        const controlsConfig = {};
        let input;

        controlsConfig['job_name'] = ['', [Validators.required]];

        // the selection for the raw counts:
        let key = "input_matrix"
        input = this.operationData.inputs[key];
        this.inputMatrixField = {
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
                this.inputMatrixField.files = data;
            });

        const configResourceField = [
            '',
            []
        ];
        controlsConfig[key] = configResourceField;

        key = 'num_clusters';
        input = this.operationData.inputs[key];
        this.numClustersField = {
            key: key,
            name: input.name,
            min: 1,
            desc: input.description,
            required: input.required
        };

        const configNumClustersField = [
            input.spec.default_value,
            [
                ...(input.required ? [Validators.required] : []),
                Validators.min(2),
                Validators.pattern(/^[1-9]\d*$/)
            ]
        ];
        controlsConfig[key] = configNumClustersField;

        key = 'num_iter';
        input = this.operationData.inputs[key];
        this.numIterField = {
            key: key,
            name: input.name,
            min: 1,
            desc: input.description,
            required: input.required
        };

        const configNumIterField = [
            input.spec.default_value,
            [
                ...(input.required ? [Validators.required] : []),
                Validators.min(100),
                Validators.pattern(/^[1-9]\d*$/)
            ]
        ];
        controlsConfig[key] = configNumIterField;

        key = 'dimension';
        input = this.operationData.inputs[key];
        this.dimensionField = {
            key: key,
            name: input.name,
            desc: input.description,
            required: input.required,
            options: input.spec.options,
            selectedOptions: []
        };
        const configDimensionField = [
            input.spec.default_value,
            [...(input.required ? [Validators.required] : [])]
        ];
        controlsConfig[key] = configDimensionField;

        const availableObsSets = this.metadataService.getCustomObservationSets().map(set => {
            const newSet = set.elements.map(elem => {
                const o = { id: elem.id };
                return o;
            });
            return { ...set, elements: newSet };
        });
        key = 'samples'
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
        controlsConfig[key] = configObsSetsField;

        const availableFeatureSets = this.metadataService.getCustomFeatureSets().map(set => {
            const newSet = set.elements.map(elem => {
                const o = { id: elem.id };
                return o;
            });
            return { ...set, elements: newSet };
        });
        key = 'features'
        input = this.operationData.inputs[key];
        this.featureSetField = {
            key: key,
            name: input.name,
            desc: input.description,
            required: input.required,
            sets: availableFeatureSets
        };
        const configFeatureSetsField = [
            undefined,
            [...(input.required ? [Validators.required] : [])]
        ];
        controlsConfig[key] = configFeatureSetsField;

        this.analysesForm = this.formBuilder.group(controlsConfig,
            {
                validators: [observationSetsValidator],
                asyncValidators: [this.obsSetService.validate_for_single_obs_set()],
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

}