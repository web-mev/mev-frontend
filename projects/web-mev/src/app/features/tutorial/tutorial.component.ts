import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
@Component({
  selector: 'mev-tutorial',
  templateUrl: './tutorial.component.html',
  styleUrls: ['./tutorial.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TutorialComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
