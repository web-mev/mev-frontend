import {
    Component,
    ChangeDetectionStrategy,
    OnChanges,
    Input
} from '@angular/core';


@Component({
    selector: 'mev-panda',
    templateUrl: './panda.component.html',
    styleUrls: ['./panda.component.css'],
    changeDetection: ChangeDetectionStrategy.Default
})
export class PandaComponent implements OnChanges {
    @Input() outputs;
    // @ViewChild('treePlot') svgElement: ElementRef;

    constructor(

    ) { }

    ngOnChanges(): void {
    }

    onResize(event) {
    }

}