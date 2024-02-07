import { AfterViewInit, Component, Output, EventEmitter, Input } from '@angular/core';
import Cropper from 'cropperjs';

@Component({
  selector: 'image-cropper',
  templateUrl: './image-cropper.component.html',
  styleUrls: ['./image-cropper.component.css']
})
export class ImageCropperComponent implements AfterViewInit {
  croppedImage = '';
  cropper: any
  @Output() childImageUrl = new EventEmitter<string>();
  @Output() displayCrop = new EventEmitter<boolean>();
  @Input() imageUrl = ''

  constructor() { }

  ngAfterViewInit(): void {
    this.runCropperJS()
  }

  runCropperJS() {
    const image = document.getElementById('image') as HTMLImageElement | null;;
    if (image) {
      // this.cropper = new Cropper(image, {
      //   zoomable: true,
      //   scalable: true
      // });
    } else {
      console.error('Image element not found');
    }
  }

  zoomIn() {
    if (this.cropper) {
      this.cropper.zoom(0.1);
    }
  }

  zoomOut() {
    if (this.cropper) {
      this.cropper.zoom(-0.1);
    }
  }

  moveLeft() {
    if (this.cropper) {
      this.cropper.move(-1, 0);
    }
  }

  moveRight() {
    if (this.cropper) {
      this.cropper.move(1, 0);
    }
  }

  moveUp() {
    if (this.cropper) {
      this.cropper.move(0, -1);
    }
  }

  moveDown() {
    if (this.cropper) {
      this.cropper.move(0, 1);
    }
  }

  setAspectRatio(ratio: number | null) {
    this.cropper.setAspectRatio(ratio);
  }

  scaleX = 1;
  scaleY = 1;
  swapHorizontal() {
    this.scaleX = -this.scaleX;
    this.cropper.scaleX(this.scaleX);
  }

  swapVertical() {
    this.scaleY = -this.scaleY;
    this.cropper.scaleY(this.scaleY);
  }

  downloadCroppedImage() {
    if (this.cropper) {
      const croppedCanvas = this.cropper.getCroppedCanvas();
      const dataUrl = croppedCanvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = dataUrl;
      downloadLink.download = 'cropped_image.png';
      downloadLink.click();
    }
  }

  onCrop() {
    if (this.cropper) {
      const croppedCanvas = this.cropper.getCroppedCanvas();
      this.imageUrl = croppedCanvas.toDataURL('image/png');

      this.childImageUrl.emit(this.imageUrl);
      this.displayCrop.emit(false)
    }
  }
}
