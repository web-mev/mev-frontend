import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import * as svgAsPng from 'save-svg-as-png';
import * as svgExport from './svg-export'

/**
 * Download Button Component
 *
 * Used in D3 charts for downloading svg image
 */
@Component({
  selector: 'mev-download-button',
  templateUrl: './download-button.component.html',
  styleUrls: ['./download-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DownloadButtonComponent {
  @Input() containerId;
  @Input() imageName;
  constructor() { }

  /**
   * Function to download the svg image
   */
  onSaveImagePNG() {
    svgAsPng.saveSvgAsPng(
      document.querySelector(this.containerId + ' svg'),
      this.imageName
    );
  }

  //Using SVG-Export.js to download as SVG
  onSaveImageSVG(){
    svgExport.downloadSvg(
      document.querySelector(this.containerId + ' svg'), 
      this.imageName, 
    );
  }
}
