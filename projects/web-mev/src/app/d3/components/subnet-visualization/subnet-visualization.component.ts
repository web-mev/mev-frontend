import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input
} from '@angular/core';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { MetadataService } from '@app/core/metadata/metadata.service';
import { AnalysesService } from '@app/features/analysis/services/analysis.service';

//@app/features/analysis/services/analysis.service
/*
* Component for presenting the form which creates a boxplot.
* The actual code to create the boxplot is in box-plotting.component.ts/html
*/
@Component({
  selector: 'mev-subnet-visualization',
  templateUrl: './subnet-visualization.component.html',
  styleUrls: ['./subnet-visualization.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class SubnetVisualizationFormComponent implements OnInit {
  @Input() workspaceId: string

  submitted = false;
  isWaiting = false;
  inputForm: FormGroup;
  all_featuresets = [];
  exp_files = [];
  plotData = [];
  isLoaded = false;
  showResult = false;
  showLoading = false;

  acceptable_resource_types = [
    'FT',
    'MTX',
  ];

  constructor(
    private formBuilder: FormBuilder,
    private metadataService: MetadataService,
    private apiService: AnalysesService
  ) { }

  ngOnInit(): void {
    this.inputForm = this.formBuilder.group({
      'expMtx': ['', Validators.required],
    })
    this.all_featuresets = this.metadataService.getCustomFeatureSets();
    this.apiService
      .getAvailableResourcesByParam(
        this.acceptable_resource_types,
        this.workspaceId
      )
      .subscribe(data => {
        this.exp_files = data;
        this.isLoaded = true;
      });
  }

  createPlot() {
    this.plotData = this.inputForm.value['expMtx'];
    this.showResult = true;
  }

  /**
   * Convenience getter for easy access to form fields
   */
  get f() {
    return this.inputForm.controls;
  }

}