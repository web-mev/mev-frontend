// import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
// import { MevBaseExpressionPlotFormComponent } from '../base-expression-plot-form/base-expression-plot-form.component';
// import { AnalysesService } from '@app/features/analysis/services/analysis.service';

import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input
} from '@angular/core';
import { FormGroup, Validators, FormBuilder, Form } from '@angular/forms';
import { MetadataService } from '@app/core/metadata/metadata.service';
import { AnalysesService } from '@app/features/analysis/services/analysis.service';

@Component({
  selector: 'mev-heatmap',
  templateUrl: './heatmap.component.html',
  styleUrls: ['./heatmap.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class HeatmapFormComponent implements OnInit {
  @Input() workspaceId: string;

  submitted = false;
  isWaiting = false;
  inputForm: FormGroup;
  all_featuresets = [];
  exp_files = [];
  plotData = [];
  PlotDataAnnotation = [];
  isLoaded = false;
  showResult = false;
  showLoading = false;

  acceptable_resource_types = [
    'MTX',
    'I_MTX',
    'EXP_MTX',
    'RNASEQ_COUNT_MTX'
  ];

  annotation_resource_type = ['ANN'];
  ann_files = [];

  constructor(
    private formBuilder: FormBuilder,
    private metadataService: MetadataService,
    private apiService: AnalysesService
  ) { }

  ngOnInit(): void {
    this.inputForm = this.formBuilder.group({
      'expMtx': ['', Validators.required],
      'featureSet': ['', Validators.required],
      'ann': ['', Validators.required],
    })
    this.all_featuresets = this.metadataService.getCustomFeatureSets();
    this.apiService
      .getAvailableResourcesByParam(
        this.acceptable_resource_types,
        this.workspaceId
      )
      .subscribe(data => {
        this.exp_files = data;
        // this.isLoaded = true;
      });

    //gets the annotation only files
    this.apiService
      .getAvailableResourcesByParam(
        this.annotation_resource_type,
        this.workspaceId
      )
      .subscribe(data => {
        this.ann_files = data;
        this.isLoaded = true;
      });
  }

  onSubmit() {
    this.submitted = true;
    this.isWaiting = true;
  }

  createPlot() {
    // console.log("input form: ", this.inputForm)
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
        console.log("features: ", features)
        this.plotData = features;
        // this.isWaiting = false;
      });

      const resourceId_ann = this.inputForm.value['ann'];
      this.apiService
      .getResourceContent(
        resourceId_ann,
      )
      .subscribe(features => {
        console.log("features_ann: ", features)
        this.PlotDataAnnotation = features;
        // this.isWaiting = false;
      });
  }

  /**
   * Convenience getter for easy access to form fields
   */
  get f() {
    return this.inputForm.controls;
  }

}
