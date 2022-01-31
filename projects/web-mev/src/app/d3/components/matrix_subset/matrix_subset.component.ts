import {
    Component,
    OnInit,
    ChangeDetectionStrategy,
    Input
} from '@angular/core';
import { AnalysesService } from '@app/features/analysis/services/analysis.service';


@Component({
  selector: 'mev-exp-subset',
  templateUrl: './matrix_subset.component.html',
  styleUrls: ['./matrix_subset.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class MatrixSubsetComponent implements OnInit  {
    @Input() outputs;
   
    analysisName = '';
    outputFilename = '';
    infoArray: string[] = [];
    reportSelections: boolean = false;

    constructor(private analysisService: AnalysesService){}

    ngOnInit() {
      this.loadInfo();
    }

    loadInfo(){
      this.analysisName = this.outputs.operation.operation_name;
      this.analysisService.getResourcesMetadata(this.outputs.reduced_matrix).subscribe(
        fileData => {
          this.outputFilename = fileData.name;
        }
      )
      let samples = this.outputs.samples;
      if (samples){
        this.reportSelections = true;
        let sampleList = samples.elements;
        if (this.outputs.keepsamples){
          this.infoArray.push(`You retained ${sampleList.length} samples/columns from the original matrix.`);
        } else {
          this.infoArray.push(`You removed ${sampleList.length} samples/columns from the original matrix.`);
        } 
      }
      let features = this.outputs.features;
      if (features){
        this.reportSelections = true;
        let featureList = features.elements;
        if (this.outputs.keepfeatures){
          this.infoArray.push(`You retained ${featureList.length} features/rows from the original matrix.`);
        } else {
          this.infoArray.push(`You removed ${featureList.length} features/rows from the original matrix.`);
        }
      }
    }
}
