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
import { BaseOperationInput } from '../base-operation-inputs/base-operation-inputs';
import { FileService } from '@file-manager/services/file-manager.service';


@Component({
    selector: 'combatseq-input',
    templateUrl: './combatseq-input.component.html',
    styleUrls: ['./combatseq-input.component.scss'],
    providers: [{ provide: BaseOperationInput, useExisting: CombatseqInputComponent }],
    changeDetection: ChangeDetectionStrategy.Default
})
export class CombatseqInputComponent extends BaseOperationInput implements OnChanges {
    analysesForm: FormGroup;
    submitted = false;

    @Input() operationData: any;
    @Input() workspaceId: string;
    @Output() formValid: EventEmitter<any> = new EventEmitter<any>();

    inputMatrixField;
    annField;
    batchChoiceField;
    otherCovarsChoiceField;

    batchVariableChoiceOptions = [];
    allCovarChoiceOptions = [];

    multipleResourcesDropdownSettings = {};

    constructor(
        private apiService: AnalysesService,
        private formBuilder: FormBuilder,
        private fileService: FileService
    ) {
        super();
        this.multipleResourcesDropdownSettings = {
            text: '',
            selectAllText: 'Select All',
            unSelectAllText: 'Unselect All',
            classes: 'resource-dropdown',
            tagToBody: false
        };
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

        // the job name field:
        controlsConfig['job_name'] = ['', [Validators.required]];

        // the selection for the raw counts:
        let key = "raw_counts"
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

        const configRawCountsField = [
            '',
            []
        ];
        controlsConfig[key] = configRawCountsField;

        key = "annotations"
        input = this.operationData.inputs[key];
        this.annField = {
            key: key,
            name: input.name,
            resource_type: input.spec.resource_type,
            desc: input.description,
            required: input.required,
            files: [],
            selectedFiles: []
        };

        this.apiService
            .getWorkspaceResourcesByParam(
                [input.spec.resource_type],
                this.workspaceId
            )
            .subscribe(data => {
                this.annField.files = data;
            });

        const configAnnField = [
            '',
            []
        ];
        controlsConfig[key] = configAnnField;

        key = 'batch_variable_choice';
        input = this.operationData.inputs[key];
        this.batchChoiceField = {
            key: key,
            name: input.name,
            desc: input.description
        };
        const configBatchChoiceField = [
            '',
            [Validators.required, Validators.minLength(1)]
        ];
        controlsConfig[key] = configBatchChoiceField;

        key = 'other_covariates'
        //input = this.operationData.inputs[key];
        this.otherCovarsChoiceField = {
            key: key,
            name: 'other covars',
            desc: 'something',
            options: [],
            selectedOptions: []
        };
        const configOtherCovarsChoiceField = [
            null,
            []
        ];
        controlsConfig[key] = configOtherCovarsChoiceField;

        this.analysesForm = this.formBuilder.group(controlsConfig);

        this.analysesForm.get('annotations').valueChanges.subscribe(
            (val) => {
                // if this is not reset, then any prior-selected value can persist.
                this.analysesForm.get('batch_variable_choice').setValue('');

                this.fileService.getFilePreview(val).subscribe(
                    (data) => {
                        const available_columns = Object.keys(data[0].values);
                        let items = [];
                        for(let c in available_columns){
                            items.push({'id': c, 'name': available_columns[c]});
                        }
                        this.batchVariableChoiceOptions = available_columns;
                        this.allCovarChoiceOptions = items;
                        this.otherCovarsChoiceField.options = items;
                    }
                );
            }
        );

        this.analysesForm.get('batch_variable_choice').valueChanges.subscribe(
            (val) => {
                let xxx = [...this.allCovarChoiceOptions]
                let name_list = xxx.map((x) => x.name);
                let idx = name_list.indexOf(val);
                if (idx > -1) {
                    xxx.splice(idx, 1);
                }
                this.otherCovarsChoiceField.options = [...xxx];
            }
        );
    }

    getInputData(): any {
        // the 'other_covariates' is an array of objects. We only need
        // the string 'name' part:
        let inputs = this.analysesForm.value;
        let other_covariates = inputs['other_covariates'].map((item) => item.name);
        inputs['other_covariates'] = other_covariates
        return inputs;
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