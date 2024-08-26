import {
    Component,
    ChangeDetectionStrategy,
    OnChanges,
    Output,
    EventEmitter,
    Input
} from '@angular/core';
import { FormGroup, Validators, FormBuilder, AbstractControl, AbstractControlOptions, ValidatorFn } from '@angular/forms';
import { AnalysesService } from '../../services/analysis.service';
import { MatDialog } from '@angular/material/dialog';
import { BaseOperationInput } from '../base-operation-inputs/base-operation-inputs';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { catchError } from "rxjs/operators";
import { NotificationService } from '@core/notifications/notification.service';

function differentGroupValidator(group1Key: string, group2Key: string): ValidatorFn {
    return (formGroup: AbstractControl): { [key: string]: any } | null => {
        const group1Control = formGroup.get(group1Key);
        const group2Control = formGroup.get(group2Key);

        if (!group1Control || !group2Control) {
            return null;
        }

        const group1Value = group1Control.value;
        const group2Value = group2Control.value;

        if (group1Value && group2Value && group1Value === group2Value) {
            group1Control.setErrors({ sameGroupError: true });
            group2Control.setErrors({ sameGroupError: true });
        } else {
            if (group1Control.hasError('sameGroupError')) {
                group1Control.setErrors(null);
            }
            if (group2Control.hasError('sameGroupError')) {
                group2Control.setErrors(null);
            }
        }

        return null;
    };
}

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
    private readonly API_URL = environment.apiUrl;

    rawCountsField;
    annField;
    columnsField;
    group1Field;
    group2Field;
    rawCountsSamples = [];
    availableObsSets = [];

    files_retrieved = false;

    columnsValueList = [];
    annotation_uuid = '';
    columnsReady = false;
    uniqueCols = []
    uniqueColsReady = false;

    constructor(
        private formBuilder: FormBuilder,
        private apiService: AnalysesService,
        public dialog: MatDialog,
        private httpClient: HttpClient,
        protected readonly notificationService: NotificationService,
    ) {
        super();
    }

    ngOnChanges(): void {
        console.log("opdata: ", this.operationData)
        if (this.operationData) {
            this.createForm();
            this.analysesForm.statusChanges.subscribe(() => this.onFormValid());
        }
    }

    getInputData(): any {
        return this.analysesForm.value;
    }

    onSubmit() {
        this.submitted = true;
    }

    public onFormValid() {
        this.formValid.emit(this.analysesForm.valid);
    }

    onSelectionAnnotation(file) {
        this.annotation_uuid = file.value;
        this.getColumnNames()
    }

    getColumnNames() {
        this.httpClient.get(`${this.API_URL}/resources/${this.annotation_uuid}/contents/?page=1&page_size=1`).pipe(
            catchError(error => {
                this.notificationService.error(`Error ${error.status}: ${error.error.error}`);
                throw error;
            })
        ).subscribe(res => {
            this.columnsReady = true
            let jsonObj = res['results'][0]['values']
            const keys = Object.keys(jsonObj);
            this.columnsValueList = keys;
        })
    }

    onSelectionAnnColumn(file) {
        let selectedColumn = file.value;
        let uniqueColumns = [];

        this.httpClient.get(`${this.API_URL}/resources/${this.annotation_uuid}/contents/`).pipe(
            catchError(error => {
                this.notificationService.error(`Error ${error.status}: ${error.error.error}`);
                throw error;
            })
        ).subscribe(res => {
            this.uniqueColsReady = true;
            for (let index in res) {
                let obj = res[index]['values'][selectedColumn]
                if (!uniqueColumns.includes(obj)) {
                    uniqueColumns.push(obj)
                }
            }
            this.uniqueCols = uniqueColumns
        })
    }

    createForm() {
        const controlsConfig = {};
        let input;

        // the job name field:
        controlsConfig['job_name'] = ['', [Validators.required]];

        // the selection for the raw counts:
        let key = "raw_counts"
        input = this.operationData.inputs[key];
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
            []
        ];
        controlsConfig[key] = configResourceField;

        key = "annotations"
        input = this.operationData.inputs[key];
        this.annField = {
            key: key,
            name: input.name,
            resource_type: input.spec.resource_type,
            desc: input.description,
            required: input.required,
            files: []
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

        key = 'ann_col';
        input = this.operationData.inputs[key];
        this.columnsField = {
            key: key,
            name: input.name,
            desc: input.description,
            required: input.required,
            options: this.columnsValueList,
        };
        const configAnnColField = [
            '',
            []
        ];
        controlsConfig[key] = configAnnColField;

        key = 'group1';
        input = this.operationData.inputs[key];
        this.group1Field = {
            key: key,
            name: input.name,
            desc: input.description,
            required: input.required,
            options: this.uniqueCols,
        };
        const configGroup1Field = [
            '',
            ...[Validators.required]
        ];
        controlsConfig[key] = configGroup1Field;

        key = 'group2';
        input = this.operationData.inputs[key];
        this.group2Field = {
            key: key,
            name: input.name,
            desc: input.description,
            required: input.required,
            options: this.uniqueCols,
        };
        const configGroup2Field = [
            '',
            ...[Validators.required]
        ];
        controlsConfig[key] = configGroup2Field;

        this.analysesForm = this.formBuilder.group(controlsConfig,
            {
                validators: [differentGroupValidator('group1', 'group2')],
                updateOn: 'change'
            } as AbstractControlOptions
        );
    }

    /**
      * Convenience getter for easy access to form fields
      */
    get f() {
        return this.analysesForm.controls;
    }
}