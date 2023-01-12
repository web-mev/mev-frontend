import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input
} from '@angular/core';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
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
  isWaiting = false; //used for loading spinner
  inputForm: FormGroup;
  all_featuresets = [];
  exp_files = [];
  plotData = [];
  PlotDataAnnotation = [];
  isLoaded = false; //used for formfield inputs being loaded
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
  useAnnotation = false;

  constructor(
    private formBuilder: FormBuilder,
    private metadataService: MetadataService,
    private apiService: AnalysesService
  ) { }

  ngOnInit(): void {
    this.inputForm = this.formBuilder.group({
      'expMtx': ['', Validators.required],
      'featureSet': ['', Validators.required],
      'ann': [''],
    })
    this.all_featuresets = this.metadataService.getCustomFeatureSets();
    this.apiService
      .getAvailableResourcesByParam(
        this.acceptable_resource_types,
        this.workspaceId
      )
      .subscribe(data => {
        this.exp_files = data;
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
  }

  savedResourceId = '';
  hasResourceChanged = false;

  createPlot() {
    this.isWaiting = true;
    const resourceId = this.inputForm.value['expMtx'];
    this.hasResourceChanged = (resourceId !== this.savedResourceId) ? true : false;
    this.savedResourceId = resourceId;

    const selectedFeatureSet = this.inputForm.value['featureSet'];
    const elements = selectedFeatureSet['elements'].map(obj => obj.id);
    const filters = { '__rowname__': '[in]:' + elements.join(',') };
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
        this.isWaiting = false;
        this.plotData = features;
      });

    const resourceId_ann = this.inputForm.value['ann'];
    if (this.inputForm.value['ann'] !== "") {
      this.useAnnotation = true;
      this.apiService
        .getResourceContent(
          resourceId_ann,
        )
        .subscribe(features => {
          this.PlotDataAnnotation = features;
        });
    }

  }

  /**
   * Convenience getter for easy access to form fields
   */
  get f() {
    return this.inputForm.controls;
  }

}
