import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input
} from '@angular/core';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { MetadataService } from '@app/core/metadata/metadata.service';
import { AnalysesService } from '@app/features/analysis/services/analysis.service';
import { FileService } from '@file-manager/services/file-manager.service';

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

  annFileSelected = false;

  multipleChoiceDropdownSettings = {};
  covarsChoiceField;

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
    private apiService: AnalysesService,
    private fileService: FileService
  ) { 

    this.multipleChoiceDropdownSettings = {
      text: '',
      selectAllText: 'Select All',
      unSelectAllText: 'Unselect All',
      classes: 'resource-dropdown',
      tagToBody: false
  };

  }

  ngOnInit(): void {

    this.covarsChoiceField = {
      key: 'other_covars',
      name: 'Covariates to show',
      desc: 'Selected covariates will be displayed with the aligned heatmap data.',
      options: [],
      selectedOptions: []
    };
    const configCovarsChoiceField = [null, []];

    this.inputForm = this.formBuilder.group({
      'expMtx': ['', Validators.required],
      'featureSet': ['', Validators.required],
      'ann': [''],
      'other_covars': configCovarsChoiceField
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



      this.inputForm.get('ann').valueChanges.subscribe(
        (val) => {
          this.annFileSelected = true;
          
          // if this is not reset, then any prior-selected value can persist.
          this.inputForm.get('other_covars').setValue('');

          this.fileService.getFilePreview(val).subscribe(
              (data) => {
                  const available_columns = Object.keys(data[0].values);
                  let items = [];
                  for(let c in available_columns){
                      items.push({'id': c, 'name': available_columns[c]});
                  }
                  this.covarsChoiceField.options = items;
              }
          );
        }
      );
  }

  onSubmit() {
    this.submitted = true;
  }

  savedResourceId = '';
  hasResourceChanged = false;

  createPlot() {
    this.isWaiting = true;
    const resourceId = this.inputForm.value['expMtx'];
    // By commenting this and setting to true, users can regenerate their figure as
    // originally drawn. Otherwise, annotations that were removed, etc. can't be 
    // recovered (since the savedResourceId has not changed). 
    //If, at a later date, we want to change this behavior, we could emit
    // a signal from the heatmap component which will indicate something has changed.
    //this.hasResourceChanged = (resourceId !== this.savedResourceId) ? true : false;
    this.hasResourceChanged = true;
    this.savedResourceId = resourceId;

    const selectedFeatureSet = this.inputForm.value['featureSet'];
    const elements = selectedFeatureSet['elements'].map(obj => obj.id);
    const filters = {
      '__rowname__': '[in]:' + elements.join(','),
      'transform-name': 'heatmap-cluster'
    };
    this.apiService
      .getResourceTransformQuery(
        resourceId,
        filters
      )
      .subscribe(features => {
        this.isWaiting = false;
        this.plotData = features;
      });

    const resourceId_ann = this.inputForm.value['ann'];
    if (this.inputForm.value['ann'] !== "") {

      const cols = this.covarsChoiceField.selectedOptions.map(obj => obj.name);
      this.useAnnotation = true;
      this.apiService
        .getResourceContent(
          resourceId_ann,
          0, //pageIndex
          0, //pageSize
          {'__colname__': '[in]:' + cols.join(',')} // filters
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
