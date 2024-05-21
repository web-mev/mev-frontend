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


@Component({
    selector: 'snf-input',
    templateUrl: './snf-input.component.html',
    styleUrls: ['./snf-input.component.scss'],
    providers: [{ provide: BaseOperationInput, useExisting: SnfInputComponent }],
    changeDetection: ChangeDetectionStrategy.Default
})
export class SnfInputComponent extends BaseOperationInput implements OnChanges {
    analysesForm: FormGroup;
    submitted = false;

    @Input() operationData: any;
    @Input() workspaceId: string;
    @Output() formValid: EventEmitter<any> = new EventEmitter<any>();

    // an array to keep track of all the potential files
    allFiles = [];
    allFileIds = [];

    // an array which will populate the 'other' files selection.
    secondaryFiles = [];

    multipleResourcesDropdownSettings = {};
    primaryMatrixField;
    secondaryMatricesField;
    numNeighborsField;
    alphaField;
    numClustersField;

    constructor(
        private apiService: AnalysesService,
        private formBuilder: FormBuilder,
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

        this.apiService
            .getWorkspaceResourcesByParam(
                ["I_MTX", "RNASEQ_COUNT_MTX", "MTX", "EXP_MTX"],
                this.workspaceId
            )
            .subscribe(data => {
                this.primaryMatrixField.files = data;
                this.secondaryMatricesField.files = data;
                this.allFiles = data;
                this.allFileIds = this.allFiles.map((x) => x.id);
            });

        // the job name field:
        controlsConfig['job_name'] = ['', [Validators.required]];

        // the selection for the raw counts:
        let key = "primary_matrix"
        input = this.operationData.inputs[key];
        this.primaryMatrixField = {
            key: key,
            name: input.name,
            resource_types: input.spec.resource_types,
            desc: input.description,
            required: input.required,
            files: this.allFiles,
            selectedFiles: []
        };

        const configPrimaryField = [
            null,
            []
        ];
        controlsConfig[key] = configPrimaryField;

        key = "input_matrices"
        input = this.operationData.inputs[key];
        this.secondaryMatricesField = {
            key: key,
            name: input.name,
            resource_types: input.spec.resource_types,
            desc: input.description,
            required: input.required,
            files: this.secondaryFiles,
            selectedFiles: []
        };

        const configSecondaryField = [
            null,
            []
        ];
        controlsConfig[key] = configSecondaryField;


        key = "num_neighbors"
        input = this.operationData.inputs[key];
        this.numNeighborsField = {
            key: key,
            name: input.name,
            desc: input.description,
            required: input.required,
            options: input.spec.options,
            selectedOptions: []
        };
        const configNumNeighborsField = [
            input.spec.default_value,
            [...(input.required ? [Validators.required] : [])]
        ];
        controlsConfig[key] = configNumNeighborsField;

        key = "alpha"
        input = this.operationData.inputs[key];
        this.alphaField = {
            key: key,
            name: input.name,
            desc: input.description,
            required: input.required,
            options: input.spec.options,
            selectedOptions: []
        };
        const configAlphaField = [
            input.spec.default_value,
            [...(input.required ? [Validators.required] : [])]
        ];
        controlsConfig[key] = configAlphaField;

        key = 'num_clusters';
        input = this.operationData.inputs[key];
        this.numClustersField = {
            key: key,
            name: input.name,
            min: input.spec.min,
            max: input.spec.max,
            desc: input.description,
            required: input.required
        };

        const configNumClustersField = [
            input.spec.default_value,
            [
                ...(input.required ? [Validators.required] : []),
                Validators.min(input.spec.min),
                Validators.max(input.spec.max),
                Validators.pattern(/^[0-9]\d*$/)
            ]
        ];
        controlsConfig[key] = configNumClustersField;


        this.analysesForm = this.formBuilder.group(controlsConfig);

        this.analysesForm.get('primary_matrix').valueChanges.subscribe(
            (val) => {
                let fileArr = [...this.allFiles];
                let index = this.allFileIds.indexOf(val);
                if (index > -1) {
                    fileArr.splice(index, 1);
                }
                this.secondaryMatricesField.files = [...fileArr];
            }
        );

        this.analysesForm.get('input_matrices').valueChanges.subscribe(
            (val) => {
                let multiSelectCurrentSelection = val.map( (x) => x.id);
                let idx;
                let fileArr = [...this.allFiles];
                let fileIds = fileArr.map((x) => x.id);
                for(let x of multiSelectCurrentSelection){
                    idx = fileIds.indexOf(x);
                    if(idx > -1){
                        fileArr.splice(idx, 1);
                        fileIds.splice(idx, 1)
                    }   
                }
                this.primaryMatrixField.files = [...fileArr];
            }
        );
    }

    getInputData(): any {
        let inputs = this.convertToFloatObj(this.analysesForm.value);
        inputs = this.handleResourceMultiSelect(inputs);
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

    /**
    * This modifies the form payload (which is ultimately
    * sent to the server) to correctly represent input fields
    * where we can accept multiple resources/files. 
    * 
    * In the case of a single resource, the input element 
    * (a select) correctly sets the form value as the resource's
    * primary key. When we use the multiselect element, there's no
    * way to get a simple list of UUIDs for the files. Hence,
    * we use this function to do that.
    */
    handleResourceMultiSelect(userInputData) {

        // need the consult the operation specification:
        const inputs = this.operationData.inputs;
        let updatedInputData = {};

        // iterate through the data obtained from the form.
        // Note that the form can contain items that are not
        // part of the operation spec (e.g. the job name)
        for (const key in userInputData) {
            if (userInputData.hasOwnProperty(key)) {

                // if this element corresponds to an input from
                // the operation specification, we need to dig deeper
                if (inputs.hasOwnProperty(key)) {
                    let input = inputs[key];
                    let field_type = input.spec.attribute_type;

                    // if this particular input corresponds to a file AND allows
                    // multiple selections:
                    let condition1 = (field_type === 'DataResource') || (field_type === 'VariableDataResource') || (field_type === 'OptionString');
                    let condition2 = (input.spec.many === true)
                    let is_multiselect = (condition1 && condition2);
                    if (is_multiselect) {
                        // iterate through the objects and extract out the primary
                        // key of the resource:
                        updatedInputData[key] = userInputData[key].map(
                            z => z['id']
                        );
                    }
                    else {
                        // the input was not file-related or only allowed a single
                        // file. simply copy over 
                        updatedInputData[key] = userInputData[key];
                    }
                } else {
                    // if we are here, we have a form value that did NOT
                    // correspond to an input in the operation spec.
                    // Simply copy it over
                    updatedInputData[key] = userInputData[key];
                }
            }
        }
        return updatedInputData;
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