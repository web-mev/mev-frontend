import { Component } from '@angular/core';
import { DifferentialExpressionComponent } from '../differential_expression/differential_expression.component';

@Component({
  selector: 'mev-deseq2',
  templateUrl: '../differential_expression/differential_expression.component.html',
  styleUrls: ['../differential_expression/differential_expression.component.scss']
})
export class Deseq2Component extends DifferentialExpressionComponent {
    imageName = 'DESeq2'
    analysisName = 'DESeq2'

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
