import { Component, ChangeDetectionStrategy, OnChanges, Output, EventEmitter, Input } from '@angular/core';
import { FormGroup, Validators, FormBuilder, AbstractControlOptions } from '@angular/forms';
import { AnalysesService } from '../../services/analysis.service';
import { BaseOperationInput } from '../base-operation-inputs/base-operation-inputs';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';


@Component({
    selector: 'likelihood-ratio-test-input',
    templateUrl: './likelihood-ratio-test-input.component.html',
    styleUrls: ['./likelihood-ratio-test-input.component.scss'],
    providers: [{ provide: BaseOperationInput, useExisting: LikelihoodRatioTestInputComponent }],
    changeDetection: ChangeDetectionStrategy.Default
})
export class LikelihoodRatioTestInputComponent extends BaseOperationInput implements OnChanges {
    analysesForm: FormGroup;
    submitted = false;

    @Input() operationData: any;
    @Input() workspaceId: string;
    @Output() formValid: EventEmitter<any> = new EventEmitter<any>();
    private readonly API_URL = environment.apiUrl;

    inputMatrixField;
    numClustersField;
    numIterField;
    dimensionField;
    obsSetField;
    featureSetField;
    matrixSamples = [];
    textFields = [];
    covariateValues = []
    covariateDetails = {}

    constructor(
        private apiService: AnalysesService,
        private formBuilder: FormBuilder,
        private httpClient: HttpClient,
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
        controlsConfig['job_name'] = ['', [Validators.required]];

        let key_counts = "raw_counts"
        let input_counts = this.operationData.inputs[key_counts];

        let inputField_counts = {

            key: key_counts,
            name: input_counts.name,
            resource_types: input_counts.spec.resource_types,
            desc: input_counts.description,
            required: input_counts.required,
            files: [],
            selectedFiles: []
        };
        this.matrixSamples.push(inputField_counts)

        this.apiService
            .getWorkspaceResourcesByParam(
                input_counts.spec.resource_types,
                this.workspaceId
            )
            .subscribe(data => {
                inputField_counts.files = data;
            });

        const configResourceField = [
            '',
            []
        ];
        controlsConfig['raw_counts'] = configResourceField;

        let key_ann = "annotations"
        let input_ann = this.operationData.inputs[key_ann];
        let inputField_ann = {
            key: key_ann,
            name: input_ann.name,
            resource_types: input_ann.spec.resource_types,
            desc: input_ann.description,
            required: input_ann.required,
            files: [],
            selectedFiles: []
        };
        this.matrixSamples.push(inputField_ann)

        this.apiService
            .getWorkspaceResourcesByParam(
                input_ann.spec.resource_type,
                this.workspaceId
            )
            .subscribe(data => {
                inputField_ann.files = data;
            });

        const configResourceField2 = [
            '',
            []
        ];
        controlsConfig['annotations'] = configResourceField2;

        let key_cov = 'covariate';
        let input_cov = this.operationData.inputs[key_cov];
        const textField = {
            key: key_cov,
            name: input_cov.name,
            desc: input_cov.description,
            required: input_cov.required
        };
        this.textFields.push(textField);
        this.covariateDetails = textField
        controlsConfig[key_cov] = [];

        this.analysesForm = this.formBuilder.group(controlsConfig,
            {
                validators: [],
                asyncValidators: [],
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

    selectionChangeLRT() {
        let uuid = this.analysesForm.value['annotations'];
        let query = `${this.API_URL}/resources/${uuid}/contents/preview/`;
        this.covariateValues = [];

        this.httpClient.get(query).subscribe(res => {
            let obj = res[0]['values'];
            for (let key in obj) {
                let temp = {
                    name: key
                }
                this.covariateValues.push(temp);
            }
        })
    }

}