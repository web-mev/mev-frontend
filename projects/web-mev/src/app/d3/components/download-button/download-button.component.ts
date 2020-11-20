import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input
} from '@angular/core';
import * as svgAsPng from 'save-svg-as-png';

@Component({
  selector: 'mev-download-button',
  templateUrl: './download-button.component.html',
  styleUrls: ['./download-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DownloadButtonComponent {
  @Input() containerId;
  @Input() imageName;
  constructor() {}

  /**
   * Function to download the svg image
   */
  onSaveImage() {
    svgAsPng.saveSvgAsPng(
      document.querySelector(this.containerId + ' svg'),
      this.imageName
    );
  }
}
