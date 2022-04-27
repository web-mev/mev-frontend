import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input
} from '@angular/core';
import { FormGroup, Validators, FormBuilder, Form } from '@angular/forms';
import { MetadataService } from '@app/core/metadata/metadata.service';
import { AnalysesService } from '@app/features/analysis/services/analysis.service';

//@app/features/analysis/services/analysis.service
/*
* Component for presenting the form which creates a boxplot.
* The actual code to create the boxplot is in box-plotting.component.ts/html
*/
@Component({
  selector: 'mev-base-expression-plot',
  templateUrl: './base-expression-plot-form.component.html',
  styleUrls: ['./base-expression-plot-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class MevBaseExpressionPlotFormComponent implements OnInit {

  @Input() workspaceId: string;
  @Input() plotType: string

  submitted = false;
  isWaiting = false;
  inputForm: FormGroup;
  inputSubnetForm: FormGroup;
  all_featuresets = [];
  exp_files = [];
  plotData = [];
  isLoaded = false;
  showResult = false;
  showLoading = false;

  acceptable_resource_types = [
    'MTX',
    'I_MTX',
    'EXP_MTX',
    'RNASEQ_COUNT_MTX',
  ];

  feature_table_only = ['FT'];

  constructor(
    private formBuilder: FormBuilder,
    private metadataService: MetadataService,
    private apiService: AnalysesService
  ) { }

  ngOnInit(): void {
    this.inputForm = this.formBuilder.group({
      'expMtx': ['', Validators.required],
      'featureSet': ['', Validators.required],
    })
    this.inputSubnetForm = this.formBuilder.group({
      'expMtx': ['', Validators.required],
    })
    this.all_featuresets = this.metadataService.getCustomFeatureSets();
    this.apiService
      .getAvailableResourcesByParam(
        (this.plotType === 'panda') ? this.feature_table_only : this.acceptable_resource_types,
        this.workspaceId
      )
      .subscribe(data => {
        this.exp_files = data;
        this.isLoaded = true;
      });
  }

  onSubmit() {
    this.submitted = true;
    this.isWaiting = true;
  }

  createPlot() {
    const resourceId = this.inputForm.value['expMtx'];
    const selectedFeatureSet = this.inputForm.value['featureSet'];
    const elements = selectedFeatureSet['elements'].map(obj => obj.id);
    const filters = { '__rowname__': '[in]:' + elements.join(',') }
    this.apiService
      .getResourceContent(
        resourceId,
        null,
        null,
        filters,
        {}
      )
      //.pipe(finalize(() => this.loadingSubject.next(false)))
      .subscribe(features => {
        this.plotData = features;
        this.isWaiting = false;
      });
  }

  createPlotNetworkSubset() {
    
    this.showLoading = true;
    const resourceId = this.inputSubnetForm.value['expMtx'];
    this.apiService
      .getResourceContent(
        resourceId,
        null,
        null,
        {},
        {}
      )
      .subscribe(features => {
        this.plotData = resourceId;
        this.showResult = true;
        this.showLoading= false;
      });
  }

  /**
   * Convenience getter for easy access to form fields
   */
  get f() {
    return this.inputForm.controls;
  }

}
