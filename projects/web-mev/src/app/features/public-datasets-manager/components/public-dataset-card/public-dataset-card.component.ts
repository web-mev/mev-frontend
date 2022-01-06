import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { PublicDataset } from '../../models/public-dataset';

@Component({
  selector: 'public-dataset-card',
  templateUrl: './public-dataset-card.component.html',
  styleUrls: ['./public-dataset-card.component.scss']
})
export class PublicDatasetCardComponent implements OnInit {

  @Input() pd?: PublicDataset;
  @Output() chooseDatasetEvent = new EventEmitter<string>();

  constructor() { }

  ngOnInit() {
  }

  viewDataset(datasetTag: string){
    console.log('view ' + datasetTag);
    this.chooseDatasetEvent.emit(datasetTag);
  }

}
