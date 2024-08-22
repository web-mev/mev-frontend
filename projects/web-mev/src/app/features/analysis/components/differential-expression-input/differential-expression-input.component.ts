import {
    Component,
    ChangeDetectionStrategy,
    OnChanges,
    Output,
    EventEmitter,
    Input
} from '@angular/core';
import { FormGroup, Validators, FormBuilder, AbstractControl, AbstractControlOptions, ValidationErrors, ValidatorFn, AsyncValidatorFn } from '@angular/forms';
import { AnalysesService } from '../../services/analysis.service';
import { MetadataService } from '@app/core/metadata/metadata.service';
import { MatDialog } from '@angular/material/dialog';
import { BaseOperationInput } from '../base-operation-inputs/base-operation-inputs';
// import { CompatibleObsSetService } from '../../services/compatible_obs_set.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { catchError } from "rxjs/operators";
import { NotificationService } from '@core/notifications/notification.service';


// checks that the chosen observation sets are 1) not the same, 2) have no intersection, and 3)  have at least two elements
// const intersectingObservationSetsValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
//     const exp_mtx_ctrl = control.get('raw_counts');
//     const obs_set_1_ctrl = control.get('base_condition_samples');
//     const obs_set_2_ctrl = control.get('experimental_condition_samples');
//     const obs_set_1 = obs_set_1_ctrl.value;
//     const obs_set_2 = obs_set_2_ctrl.value;
//     if (obs_set_1 && obs_set_2) {
//         exp_mtx_ctrl.markAsTouched();

//         if (obs_set_1.name === obs_set_2.name) {
//             obs_set_1_ctrl.setErrors({ sameName: true });
//             obs_set_2_ctrl.setErrors({ sameName: true });
//             exp_mtx_ctrl.setErrors(null);
//             obs_set_1_ctrl.markAsTouched();
//             obs_set_2_ctrl.markAsTouched();
//             exp_mtx_ctrl.markAsTouched();
//             return { sameName: true }
//         }

//         const v1 = obs_set_1.elements.map(item => {
//             return item.id;
//         });
//         const v2 = obs_set_2.elements.map(item => {
//             return item.id;
//         })

//         let tooFewSamples = false;
//         if (v1.length < 2) {
//             obs_set_1_ctrl.setErrors({ tooFewSamples: true });
//             tooFewSamples = true;
//         }
//         if (v2.length < 2) {
//             obs_set_2_ctrl.setErrors({ tooFewSamples: true });
//             tooFewSamples = true;
//         }
//         if (tooFewSamples) {
//             return { tooFewSamples: true }
//         }

//         const elements_1 = new Set(v1);
//         const elements_2 = new Set(v2);
//         let intersection = [];
//         for (const v of elements_1) {
//             if (elements_2.has(v)) {
//                 intersection.push(v)
//             }
//         }
//         if (intersection.length > 0) {
//             obs_set_1_ctrl.setErrors({ intersection: true });
//             obs_set_2_ctrl.setErrors({ intersection: true });
//             obs_set_1_ctrl.markAsTouched();
//             obs_set_2_ctrl.markAsTouched();
//             return { intersection: intersection }
//         } else {
//             obs_set_1_ctrl.setErrors(null);
//             obs_set_2_ctrl.setErrors(null);
//             exp_mtx_ctrl.setErrors(null);
//             obs_set_1_ctrl.markAsTouched();
//             obs_set_2_ctrl.markAsTouched();
//             exp_mtx_ctrl.markAsTouched();
//             return null;
//         }
//     } else {
//         obs_set_1_ctrl.setErrors(null);
//         obs_set_2_ctrl.setErrors(null);
//         obs_set_1_ctrl.markAsTouched();
//         obs_set_2_ctrl.markAsTouched();
//         return null;
//     }
// };

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
    // ctrlObsSetField;
    // experimentalObsSetField;
    annField;
    // baseConditionNameField;
    // experimentalConditionNameField;
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
        // private metadataService: MetadataService,
        public dialog: MatDialog,
        // private obsSetService: CompatibleObsSetService,
        private httpClient: HttpClient,
        protected readonly notificationService: NotificationService,
    ) {
        super();
    }

    ngOnChanges(): void {
        if (this.operationData) {
            console.log("opdata: ", this.operationData)
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
        console.log("form:  ", this.analysesForm)
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
        console.log("ann col: ", file.value)
        let selectedColumn = file.value
        let uniqueColumns = []

        this.httpClient.get(`${this.API_URL}/resources/${this.annotation_uuid}/contents/`).pipe(
            catchError(error => {
                this.notificationService.error(`Error ${error.status}: ${error.error.error}`);
                throw error;
            })
        ).subscribe(res => {
            this.uniqueColsReady = true
            console.log("columns all: ", res)
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
            files: [],
            // selectedFiles: []
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
            []
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
            []
        ];
        controlsConfig[key] = configGroup2Field;

        this.analysesForm = this.formBuilder.group(controlsConfig,
            {
                // validators: [intersectingObservationSetsValidator],
                validators: [],
                // asyncValidators: [],
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