import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input
} from '@angular/core';
import { File } from '@app/features/file-manager/models/file';

@Component({
  selector: 'mev-file-item',
  templateUrl: './file-item.component.html',
  styleUrls: ['./file-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FileItemComponent implements OnInit {
  @Input() file: File;

  constructor() {}

  ngOnInit(): void {}
}
