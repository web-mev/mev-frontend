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
    batchVariableChoiceOptions = [];

    constructor(
        private apiService: AnalysesService,
        private formBuilder: FormBuilder,
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
        console.log('in createform', this.operationData)
        const controlsConfig = {};
        let input;

        // the job name field:
        controlsConfig['job_name'] = ['', [Validators.required]];

        // the selection for the raw counts:
        let key = "raw_counts"
        input = this.operationData.inputs[key];
        console.log('raw counts input: ',input)
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
        this.batchChoiceField = {
            key: key,
            name: 'Batching variable:',
            desc: 'The variable (found in the selected annotation file) which is used to indicate the batch for each sample.',
        };
        const configBatchChoiceField = [
            '',
            [Validators.required, Validators.minLength(1)]
        ];
        controlsConfig[key] = configBatchChoiceField;

        this.analysesForm = this.formBuilder.group(controlsConfig);

        this.analysesForm.get('annotations').valueChanges.subscribe(
            (val) => {
                // if this is not reset, then any prior-selected value can persist.
                this.analysesForm.get('batch_variable_choice').setValue('');
                this.fileService.getFilePreview(val).subscribe(
                    (data) => {
                        const available_columns = Object.keys(data[0].values);
                        this.batchVariableChoiceOptions = available_columns;
                    }
                );
            }
        );
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