import { Component, OnChanges, ChangeDetectionStrategy, SimpleChanges, Input } from '@angular/core';
import { PublicDatasetsComponent } from '../public-datasets.component';

@Component({
  selector: 'mev-checkbox',
  templateUrl: './checkbox.component.html',
  styleUrls: ['./checkbox.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckBoxComponent implements OnChanges {
  @Input() info;
  @Input() checked;
  @Input() title;
  @Input() currentDataset;
  
  constructor(public pds: PublicDatasetsComponent) { }

  ngOnChanges(changes: SimpleChanges): void {}
}
