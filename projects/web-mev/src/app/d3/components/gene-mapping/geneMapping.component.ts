import {
    Component,
    ChangeDetectionStrategy,
    OnChanges,
    Input
} from '@angular/core';


@Component({
    selector: 'mev-gene-mapping',
    templateUrl: './geneMapping.component.html',
    styleUrls: ['./geneMapping.component.css'],
    changeDetection: ChangeDetectionStrategy.Default
})
export class GeneMappingComponent implements OnChanges {
    @Input() outputs;
    // @ViewChild('treePlot') svgElement: ElementRef;

    constructor(

    ) { }

    ngOnChanges(): void {
    }

    onResize(event) {
    }

}
