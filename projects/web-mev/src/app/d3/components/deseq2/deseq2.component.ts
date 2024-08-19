import { Component } from '@angular/core';
import { DifferentialExpressionComponent } from '../differential_expression/differential_expression.component';

@Component({
  selector: 'mev-deseq2',
  templateUrl: './deseq2.component.html',
  styleUrls: ['../differential_expression/differential_expression.component.scss']
})
export class Deseq2Component extends DifferentialExpressionComponent {
    imageName = 'DESeq2'
    analysisName = 'DESeq2'

    displayedColumns = [
        'name',
        'overall_mean',
        'log2FoldChange',
        'lfcSE',
        'statistic',
        'pvalue',
        'padj'
      ]

    ngAfterViewInit() {
        super.ngAfterViewInit();
    }
    
    ngOnChanges() {
        super.ngOnChanges();
    }
}
