import { Component, ChangeDetectionStrategy, OnChanges, Output, EventEmitter, Input } from '@angular/core';
import { FormGroup, Validators, FormBuilder, AbstractControlOptions } from '@angular/forms';
import { AnalysesService } from '../../services/analysis.service';
import { BaseOperationInput } from '../base-operation-inputs/base-operation-inputs';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { MetadataService } from '@app/core/metadata/metadata.service';


@Component({
    selector: 'stgradient-input',
    templateUrl: './stgradient-input.component.html',
    styleUrls: ['./stgradient-input.component.scss'],
    providers: [{ provide: BaseOperationInput, useExisting: StgradientInputComponent }],
    changeDetection: ChangeDetectionStrategy.Default
})
export class StgradientInputComponent extends BaseOperationInput implements OnChanges {
    analysesForm: FormGroup;
    submitted = false;

    @Input() operationData: any;
    @Input() workspaceId: string;
    @Output() formValid: EventEmitter<any> = new EventEmitter<any>();
    private readonly API_URL = environment.apiUrl;

    reference_cluster_selection: string = '';
    availableObsSets;
    sampleNameField;
    obsSetField;
    stClustResultsField;
    rawCountsField;
    coordMetadataField;
    normalizationMethodField;
    distanceSummaryField;
    numGenesField;
    clustering_job_id='';

    stclust_retrieved = false;
    files_retrieved = false;
    stclust_results = [];
    raw_count_files = [];
    ann_files = [];

    outputs_file_uuid;
    input_counts_uuid;
    input_metadata_uuid;
    normalization_method;

    constructor(
        private apiService: AnalysesService,
        private formBuilder: FormBuilder,
        private httpClient: HttpClient,
        private metadataService: MetadataService
    ) {
        super();

        // get and 'cache' the available observation sets
        this.availableObsSets = this.metadataService.getCustomObservationSets().map(set => {
            const newSet = set.elements.map(elem => {
                const o = { id: elem.id };
                return o;
            });
            return { ...set, elements: newSet };
        });
    }

    ngOnChanges(): void {
        if (this.operationData) {
            this.createForm();
            this.analysesForm.statusChanges.subscribe(() => this.onFormValid());
        }
        if(this.workspaceId && !this.stclust_retrieved){
            this.queryForSTclustResults();
        }
        if(this.workspaceId && this.operationData && !this.files_retrieved){
            this.getPotentialInputFiles();
        }
    }

    public onFormValid() {
        this.formValid.emit(this.analysesForm.valid);
    }

    createForm() {

        let key;
        let input;
        const controlsConfig = {};
        controlsConfig['job_name'] = ['', [Validators.required]];
        controlsConfig['reference_cluster_selection'] = [this.reference_cluster_selection, []];
        
        key = 'sample_name'
        input = this.operationData.inputs[key];
        this.sampleNameField = {
            key: key,
            name: input.name,
            desc: input.description,
            required: input.required,
        };
        const configSampleNameField = [
            undefined,
            [...(input.required ? [Validators.required] : [])]
        ];
        controlsConfig[key] = configSampleNameField;
        
        key = 'barcodes';
        if(this.reference_cluster_selection === 'obs_set') {
            input = this.operationData.inputs[key];
            this.obsSetField = {
                key: key,
                name: input.name,
                desc: input.description,
                required: input.required,
                sets: this.availableObsSets
            };
            const configObsSetsField = [
                undefined,
                [...(input.required ? [Validators.required] : [])]
            ];
            controlsConfig[key] = configObsSetsField;

            key = "raw_counts"
            input = this.operationData.inputs[key];
            this.rawCountsField = {
                key: key,
                name: input.name,
                resource_types: input.spec.resource_types,
                desc: input.description,
                required: input.required,
                files: this.raw_count_files,
                selectedFiles: []
            };
    
            const configRawCountsField = [
                '',
                []
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
                selectedFiles: []
            };
    
            const configCoordMetaField = [
                '',
                []
            ];
            controlsConfig[key] = configCoordMetaField;

            key = 'normalization_method';
            input = this.operationData.inputs[key];
            this.normalizationMethodField = {
                key: key,
                name: input.name,
                desc: input.description,
                options: input.spec.options
            };
            const configNormalizationMethodChoiceField = [
                '',
                [Validators.required, Validators.minLength(1)]
            ];
            controlsConfig[key] = configNormalizationMethodChoiceField;

        } else { // user has elected to use prior clustering results
            input = this.operationData.inputs[key];
            this.stClustResultsField = {
                key: key,
                name: input.name,
                desc: input.description,
                required: input.required,
                jobs: this.stclust_results
            };
            const configSTClustResultsField = [
                undefined,
                [...(input.required ? [Validators.required] : [])]
            ];
            controlsConfig[key] = configSTClustResultsField;  
        } 

        key = 'distance_summary';
        input = this.operationData.inputs[key];
        this.distanceSummaryField = {
            key: key,
            name: input.name,
            desc: input.description,
            options: input.spec.options
        };
        const configDistanceSummaryChoiceField = [
            '',
            [Validators.required, Validators.minLength(1)]
        ];
        controlsConfig[key] = configDistanceSummaryChoiceField;

        key = 'num_genes';
        input = this.operationData.inputs[key];
        this.numGenesField = {
            key: key,
            name: input.name,
            min: 1,
            desc: input.description,
            required: input.required
        };

        const configNumGenesField = [
            input.spec.default_value,
            [
                ...(input.required ? [Validators.required] : []),
                Validators.min(1),
                Validators.pattern(/^[1-9]\d*$/)
            ]
        ];
        controlsConfig[key] = configNumGenesField;

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
     * Triggered when the toggle is chosen to select between using an observation 
     * set and using prior STClust results.
     */
    clusterOptionChange(){
        this.reference_cluster_selection = this.analysesForm.value.reference_cluster_selection;
        this.createForm();
    }

    /**
     * Grabs all successful STClust runs in the current workspace
     */
    queryForSTclustResults(){
        this.apiService
            .getExecOperations(
                this.workspaceId
            )
            .subscribe(data => {
                console.log(data);
                this.stclust_results = data.filter(
                    (exec_op) => (exec_op.operation.operation_name === 'spatialGE clustering')
                    && (!exec_op.job_failed)
                );
                this.stclust_retrieved = true;
            });

    }

    getPotentialInputFiles(){
        let raw_counts_input = this.operationData.inputs['raw_counts'];
        let coords_metadata_input = this.operationData.inputs['coords_metadata'];
        let all_resource_types = [...raw_counts_input.spec.resource_types, coords_metadata_input.spec.resource_type]
        this.apiService
            .getWorkspaceResourcesByParam(
                all_resource_types,
                this.workspaceId
            )
            .subscribe(data => {
                console.log('all files: ', data)
                for(let file_data of data){
                    if(raw_counts_input.spec.resource_types.includes(file_data.resource_type)){
                        this.raw_count_files.push(file_data);
                    } 
                    else if(file_data.resource_type === coords_metadata_input.spec.resource_type){
                        this.ann_files.push(file_data)
                    }
                }
                this.files_retrieved = true;
            });
    }

    onJobSelection(){
        let val = this.analysesForm.value.barcodes;
        // TODO: use the UUID here to get the results for plotting.
        this.outputs_file_uuid = val.outputs.clustered_positions;
        this.input_counts_uuid = val.inputs.raw_counts;
        this.input_metadata_uuid = val.inputs.coords_metadata;
        this.normalization_method = val.inputs.normalization_method;
        this.clustering_job_id = val.id;

    }

}