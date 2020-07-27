import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'mev-analyses',
  templateUrl: './analyses.component.html',
  styleUrls: ['./analyses.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnalysesComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
