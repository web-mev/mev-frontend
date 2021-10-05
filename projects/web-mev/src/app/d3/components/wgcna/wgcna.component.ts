import {
  Component,
  ChangeDetectionStrategy,
  Input,
  OnInit
} from '@angular/core';


/**
 * Used for Combat-Seq output
 */
@Component({
  selector: 'mev-wgcna',
  templateUrl: './wgcna.component.html',
  styleUrls: ['./wgcna.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class WgcnaComponent implements OnInit {
  @Input() outputs;
  analysisName = 'WGCNA';

  constructor() {}

  ngOnInit() {
    console.log('on init...');
  }
  
}
