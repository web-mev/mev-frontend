import { Component } from '@angular/core';
import { DifferentialExpressionComponent } from '../differential_expression/differential_expression.component';

@Component({
  selector: 'mev-limma',
  templateUrl: './limma.component.html',
  styleUrls: ['../differential_expression/differential_expression.component.scss']
})
export class LimmaComponent extends DifferentialExpressionComponent {
    imageName = 'Limma'
    analysisName = 'Limma/voom'

    displayedColumns = [
        'name',
        'overall_mean',
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
