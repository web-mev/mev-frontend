import { Component, OnInit } from '@angular/core';


@Component({
  selector: 'mev-public-datasets',
  templateUrl: './public-datasets.component.html',
  styleUrls: ['./public-datasets.component.scss']
})
export class PublicDatasetsComponent implements OnInit {

  chosenDataset = '';

  constructor(
  ) {}

  ngOnInit() {
  }

  setDataset(datasetTag: string){
    console.log('Set dataset to ' + datasetTag);
    this.chosenDataset = datasetTag;
  }

  backToBrowse() {
      this.chosenDataset = '';
  }

}
