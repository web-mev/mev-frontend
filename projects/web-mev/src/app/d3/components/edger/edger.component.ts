import { Component } from '@angular/core';
import { DifferentialExpressionComponent } from '../differential_expression/differential_expression.component';

@Component({
  selector: 'mev-edger',
  templateUrl: './edger.component.html',
  styleUrls: ['../differential_expression/differential_expression.component.scss']
})
export class EdgerComponent extends DifferentialExpressionComponent {
    imageName = 'edgeR'
    analysisName = 'edgeR'

    displayedColumns = [
        'name',
        'log2FoldChange',
        'statistic',
        'pvalue',
        'padj'
      ];

    ngOnInit() {
        super.ngOnInit();
    }
    ngAfterViewInit() {
        super.ngAfterViewInit();
    }
    ngOnChanges() {
        super.ngOnChanges();
    }
}
