import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input
} from '@angular/core';

@Component({
  selector: 'mev-analysis-result',
  templateUrl: './analysis-result.component.html',
  styleUrls: ['./analysis-result.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class AnalysisResultComponent implements OnInit {
  @Input() data;
  pcaData;
  constructor() {}

  ngOnInit(): void {
    const headers = this.data.columns;
    const values = this.data.values;
    const samples = this.data.rows;

    const pcaPoints = values.map(point => {
      const newPoint = {};
      headers.forEach((header, idx) => (newPoint[header] = point[idx]));
      return newPoint;
    });

    samples.forEach(
      (sampleName, idx) => (pcaPoints[idx]['sample'] = sampleName)
    );
    this.pcaData = {
      pcaPoints: pcaPoints,
      axisInfo: this.data.pca_explained_variances
    };
  }
}
