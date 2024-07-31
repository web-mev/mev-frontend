import { Component, ChangeDetectionStrategy, OnChanges, Output, EventEmitter, Input } from '@angular/core';
import { FormGroup, Validators, FormBuilder, AbstractControlOptions } from '@angular/forms';
import { AnalysesService } from '../../services/analysis.service';
import { BaseOperationInput } from '../base-operation-inputs/base-operation-inputs';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { catchError } from "rxjs/operators";
import { NotificationService } from '@core/notifications/notification.service';

@Component({
    selector: 'spatialge-clustering-input',
    templateUrl: './spatialge-clustering-input.component.html',
    styleUrls: ['./spatialge-clustering-input.component.scss'],
    providers: [{ provide: BaseOperationInput, useExisting: SpatialgeClusteringInputComponent }],
    changeDetection: ChangeDetectionStrategy.Default
})

export class SpatialgeClusteringInputComponent extends BaseOperationInput implements OnChanges {
    analysesForm: FormGroup;
    submitted = false;

    @Input() operationData: any;
    @Input() workspaceId: string;
    @Output() formValid: EventEmitter<any> = new EventEmitter<any>();
    private readonly API_URL = environment.apiUrl;

    // availableFeatureSets;
    sampleNameField;
    // stClustResultsField;
    rawCountsField;
    coordMetadataField;
    normalizationMethodField;
    xPosField;
    yPosField;

    clusterNumField;
    outputPrefixField;

    // clustering_job_id = '';

    stclust_retrieved = false;
    files_retrieved = false;
    stclust_results = [];
    raw_count_files = [];
    ann_files = [];

    // outputs_file_uuid;
    // input_counts_uuid = '';
    // input_metadata_uuid = '';
    // normalization_method = '';

    curr_coords_metadata_uuid = '';

    isLoading = false;
    xAxisValueList: string[] = [];
    yAxisValueList: string[] = [];

    constructor(
        private apiService: AnalysesService,
        private formBuilder: FormBuilder,
        private httpClient: HttpClient,
        protected readonly notificationService: NotificationService,
    ) {
        super();
    }

    ngOnChanges(): void {
        if (this.operationData) {
            this.createForm();
            this.analysesForm.statusChanges.subscribe(() => this.onFormValid());
        }
        if (this.workspaceId && !this.stclust_retrieved) {
            this.queryForSTclustResults();
        }
        if (this.workspaceId && this.operationData && !this.files_retrieved) {
            this.getPotentialInputFiles();
        }
    }

    public onFormValid() {
        this.formValid.emit(this.analysesForm.valid);
    }

    onSelectionChangeCoordMetadata(file) {
        this.curr_coords_metadata_uuid = file.value
        this.getAxisColumnNames()
    }

    getAxisColumnNames() {
        this.isLoading = true;
        this.httpClient.get(`${this.API_URL}/resources/${this.curr_coords_metadata_uuid}/contents/?page=1&page_size=1`).pipe(
            catchError(error => {
                this.isLoading = false;
                this.notificationService.error(`Error ${error.status}: ${error.error.error}`);
                throw error;
            })
        ).subscribe(res => {
            this.isLoading = false;
            let jsonObj = res['results'][0]['values']
            const keys = Object.keys(jsonObj);
            this.xAxisValueList = keys;
            this.yAxisValueList = keys;
        })
    }

    createForm() {
        let key;
        let input;
        const controlsConfig = {};
        controlsConfig['job_name'] = ['', [Validators.required]];

        key = 'sample_name'
        input = this.operationData.inputs[key];
        this.sampleNameField = {
            key: key,
            name: input.name,
            desc: input.description,
            required: input.required
        };

        const configSampleNameField = [
            '',
            [...(input.required ? [Validators.required] : [])]
        ];
        controlsConfig[key] = configSampleNameField;

        key = "raw_counts"
        input = this.operationData.inputs[key];
        this.rawCountsField = {
            key: key,
            name: input.name,
            resource_types: input.spec.resource_types,
            desc: input.description,
            required: input.required,
            files: this.raw_count_files,
        };

        const configRawCountsField = [
            '',
            [...(input.required ? [Validators.required] : [])]
        ];
        controlsConfig[key] = configRawCountsField;

        key = "coords_metadata"
        input = this.operationData.inputs[key];
        this.coordMetadataField = {
            key: key,
            name: input.name,
            resource_types: input.spec.resource_types,
            desc: input.description,
            required: input.required,
            files: this.ann_files,
        };

        const configCoordMetaField = [
            '',
            [...(input.required ? [Validators.required] : [])]
        ];
        controlsConfig[key] = configCoordMetaField;

        key = 'normalization_method';
        input = this.operationData.inputs[key];
        this.normalizationMethodField = {
            key: key,
            name: input.name,
            desc: input.description,
            required: input.required,
            options: input.spec.options
        };
        const configNormalizationMethodChoiceField = [
            '',
            [...(input.required ? [Validators.required] : [])]
        ];
        controlsConfig[key] = configNormalizationMethodChoiceField;

        key = 'xpos_col';
        input = this.operationData.inputs[key];
        this.xPosField = {
            key: key,
            name: input.name,
            desc: input.description,
            required: input.required,
            options: input.spec.options,
        };
        const configXPosField = [
            '',
            [...(input.required ? [Validators.required] : [])]
        ];
        controlsConfig[key] = configXPosField;

        key = 'ypos_col';
        input = this.operationData.inputs[key];
        this.yPosField = {
            key: key,
            name: input.name,
            required: input.required,
            desc: input.description,
        };
        const configYPosField = [
            '',
            [...(input.required ? [Validators.required] : [])]
        ];
        controlsConfig[key] = configYPosField;

        key = 'cluster_num';
        input = this.operationData.inputs[key];
        this.clusterNumField = {
            key: key,
            name: input.name,
            desc: input.description,
            required: input.required,
            options: input.spec.options
        };
        const configClusterNumField = [
            '',
            [...(input.required ? [Validators.required] : [])]
        ];
        controlsConfig[key] = configClusterNumField;

        key = 'output_prefix';
        input = this.operationData.inputs[key];
        this.outputPrefixField = {
            key: key,
            name: input.name,
            desc: input.description,
            required: input.required,
            options: input.spec.options
        };
        const configOutputPrefixField = [
            '',
            [...(input.required ? [Validators.required] : [])]
        ];
        controlsConfig[key] = configOutputPrefixField;

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


    /**
     * Grabs all successful STClust runs in the current workspace
     */
    queryForSTclustResults() {
        this.apiService
            .getExecOperations(
                this.workspaceId
            )
            .subscribe(data => {
                this.stclust_results = data.filter(
                    (exec_op) => (exec_op.operation.operation_name === 'spatialGE clustering')
                        && (!exec_op.job_failed)
                );
                this.stclust_retrieved = true;
            });
    }

    getPotentialInputFiles() {
        let raw_counts_input = this.operationData.inputs['raw_counts'];
        let coords_metadata_input = this.operationData.inputs['coords_metadata'];
        let all_resource_types = [...raw_counts_input.spec.resource_types, coords_metadata_input.spec.resource_type]
        this.apiService
            .getWorkspaceResourcesByParam(
                all_resource_types,
                this.workspaceId
            )
            .subscribe(data => {
                for (let file_data of data) {
                    if (raw_counts_input.spec.resource_types.includes(file_data.resource_type)) {
                        this.raw_count_files.push(file_data);
                    }
                    else if (file_data.resource_type === coords_metadata_input.spec.resource_type) {
                        this.ann_files.push(file_data)
                    }
                }
                this.files_retrieved = true;
            });
    }

    scrollTo(htmlID) {
        const element = document.getElementById(htmlID) as HTMLElement;
        element.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
    }
}