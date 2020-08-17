import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input
} from '@angular/core';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { AnalysesService } from '../../services/analysis.service';
import { ActivatedRoute } from '@angular/router';
import { Workspace } from '@app/features/workspace-manager/models/workspace';
import { Observable } from 'rxjs';

@Component({
  selector: 'mev-deseq2',
  templateUrl: './deseq2.component.html',
  styleUrls: ['./deseq2.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Deseq2Component implements OnInit {
  analysesForm: FormGroup;
  submitted = false;
  multipleResourcesDropdownSettings = {};
  workspaceId: string;
  workspace$: Observable<Workspace>;

  // default settings for analyses fields
  numField1 = {
    key: 'numField1',
    name: 'Placeholder for Numeric Field 1',
    min: 0,
    max: 1,
    desc: 'Description for  Numeric Field 1',
    required: false,
    visible: false
  };

  numField2 = {
    key: 'numField2',
    name: 'Placeholder for Numeric Field 2',
    min: 0,
    max: 1,
    desc: 'Description for  Numeric Field 2',
    required: false,
    visible: false
  };

  resourceField1 = {
    key: 'resourceField1',
    name: 'Placeholder for Resource Field 1',
    type: [],
    desc: 'Description for Resource Field 1',
    required: false,
    visible: false,
    files: []
  };

  multipleResourceField1 = {
    key: 'multipleResourceField1',
    name: 'Placeholder for Multiple Resource Field 1',
    type: [],
    desc: 'Description for Multiple Resource Field 1',
    required: false,
    visible: false,
    files: [],
    selectedFiles: []
  };

  textField1 = {
    key: 'textField1',
    name: 'Placeholder for Text Field 1',
    desc: 'Description for Text Field 1',
    required: false,
    visible: false
  };

  constructor(
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private apiService: AnalysesService
  ) {
    this.loadData();
    this.generateControlsConfig();
  }

  ngOnInit(): void {
    this.multipleResourcesDropdownSettings = {
      text: '',
      selectAllText: 'Select All',
      unSelectAllText: 'Unselect All',
      classes: 'resource-dropdown'
    };
  }

  loadData() {
    this.workspaceId = this.route.snapshot.paramMap.get('workspaceId');

    this.workspace$ = this.apiService.getWorkspaceDetail(this.workspaceId);

    // TO UPDATE - should be get from API
    this.numField1.key = 'p_val';
    this.numField1.name = 'P-value threshold: ';
    this.numField1.desc = 'The filtering threshold for the p-value';
    this.numField1.visible = true;
    this.numField1.required = false;
    this.numField1.min = 0;
    this.numField1.max = 1;

    this.numField2.key = 'x_val';
    this.numField2.name = 'Some test value: ';
    this.numField2.desc = 'The filtering threshold';
    this.numField2.visible = false;
    this.numField2.required = true;
    this.numField2.min = 0;
    this.numField2.max = 100;

    this.resourceField1.key = 'count_matrix';
    this.resourceField1.name = 'Count matrix:';
    this.resourceField1.desc = 'The count matrix of expressions';
    this.resourceField1.type = ['I_MTX', 'RNASEQ_COUNT_MTX'];
    this.resourceField1.visible = true;
    this.resourceField1.required = false;

    this.apiService
      .getAvailableResourcesByParam(this.resourceField1.type, this.workspaceId)
      .subscribe(data => {
        this.resourceField1.files = data;
      });

    this.multipleResourceField1.key = 'multi_count_matrix';
    this.multipleResourceField1.name = 'Count matrix (multiple):';
    this.multipleResourceField1.desc = 'The count matrix of expressions';
    this.multipleResourceField1.type = ['MTX', 'RNASEQ_COUNT_MTX'];
    this.multipleResourceField1.visible = false;
    this.multipleResourceField1.required = false;

    this.apiService
      .getAvailableResourcesByParam(
        this.multipleResourceField1.type,
        this.workspaceId
      )
      .subscribe(data => {
        this.multipleResourceField1.files = data;
      });

    this.textField1.key = 'output_filename';
    this.textField1.name = 'Output file name: ';
    this.textField1.desc =
      'The name of the output file of differentially expressed genes. We will automatically add ".tsv" to the end.';
    this.textField1.visible = true;
    this.textField1.required = false;
  }

  generateControlsConfig() {
    const configNumField1 = [
      '',
      [
        ...(this.numField1.required ? [Validators.required] : []),
        Validators.min(this.numField1.min),
        Validators.max(this.numField1.max),
        Validators.pattern(/^-?\d*(\.\d+)?$/)
      ]
    ];

    const configNumField2 = [
      '',
      [
        ...(this.numField2.required ? [Validators.required] : []),
        Validators.min(this.numField2.min),
        Validators.max(this.numField2.max),
        Validators.pattern(/^-?\d*(\.\d+)?$/)
      ]
    ];

    const configTextField1 = [
      '',
      [...(this.textField1.required ? [Validators.required] : [])]
    ];

    const configResourceField1 = [
      '',
      [...(this.resourceField1.required ? [Validators.required] : [])]
    ];

    const multipleResourceField1 = [
      [],
      [...(this.multipleResourceField1.required ? [Validators.required] : [])]
    ];

    const controlsConfig = {};
    controlsConfig[this.numField1.key] = configNumField1;
    controlsConfig[this.numField2.key] = configNumField2;
    controlsConfig[this.textField1.key] = configTextField1;
    controlsConfig[this.resourceField1.key] = configResourceField1;
    controlsConfig[this.multipleResourceField1.key] = multipleResourceField1;

    this.analysesForm = this.formBuilder.group(controlsConfig);
  }

  onSubmit() {
    this.submitted = true;
  }

  startAnalysis() {}

  // convenience getter for easy access to form fields
  get f() {
    return this.analysesForm.controls;
  }
}
