import {
    Component,
    OnInit,
    ChangeDetectionStrategy,
    Input
} from '@angular/core';
import { AnalysesService } from '@app/features/analysis/services/analysis.service';


@Component({
  selector: 'mev-cell-ranger',
  templateUrl: './cell_ranger.component.html',
  styleUrls: ['./cell_ranger.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class CellRangerComponent implements OnInit  {
    @Input() outputs;
    analysisName = '';
    outputFilename = '';

    constructor(private analysisService: AnalysesService){}

    ngOnInit() {
      this.loadInfo();
    }

    loadInfo(){
      this.analysisName = this.outputs.operation.operation_name;
      this.analysisService.getResourcesMetadata(this.outputs.output_matrix).subscribe(
        fileData => {
          this.outputFilename = fileData.name;
        }
      )
    }

    
}
