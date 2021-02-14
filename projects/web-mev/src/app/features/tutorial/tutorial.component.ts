import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

/**
 * Tutorial Component
 *
 * Display youtube player with tutorials (the Tutorial page)
 */
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
