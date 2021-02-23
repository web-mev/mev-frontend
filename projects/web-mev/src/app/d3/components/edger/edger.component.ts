import { Component } from '@angular/core';
import { DifferentialExpressionComponent } from '../differential_expression/differential_expression.component';

@Component({
  selector: 'mev-edger',
  templateUrl: '../differential_expression/differential_expression.component.html',
  styleUrls: ['../differential_expression/differential_expression.component.scss']
})
export class EdgerComponent extends DifferentialExpressionComponent {
    imageName = 'edgeR'
    analysisName = 'edgeR'

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
