import { Component, OnInit, Input } from '@angular/core';
import { PublicDataset } from '../../models/public-dataset';

@Component({
  selector: 'public-dataset-card',
  templateUrl: './public-dataset-card.component.html',
  styleUrls: ['./public-dataset-card.component.scss']
})
export class PublicDatasetCardComponent implements OnInit {

  @Input() pd?: PublicDataset;

  constructor() { }

  ngOnInit() {
  }

  viewDataset(datasetTag: string){
    console.log('look at ' + datasetTag);
  }

}
