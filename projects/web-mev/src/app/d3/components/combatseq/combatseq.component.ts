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
  selector: 'mev-combatseq',
  templateUrl: './combatseq.component.html',
  styleUrls: ['./combatseq.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class CombatseqComponent implements OnInit {
  @Input() outputs;
  analysisName = 'ComBat-seq';

  constructor() {}

  ngOnInit() {
  }
  
}
