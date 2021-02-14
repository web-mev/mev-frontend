import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

/**
 * Spinner Overlay Component
 *
 * Used as an indicator of progress
 */
@Component({
  selector: 'mev-spinner-overlay',
  templateUrl: './spinner-overlay.component.html',
  styleUrls: ['./spinner-overlay.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpinnerOverlayComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
