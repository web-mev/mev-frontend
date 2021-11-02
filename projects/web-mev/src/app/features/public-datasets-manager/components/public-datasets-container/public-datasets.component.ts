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
    console.log('in public datasets container init...');
  }

  setDataset(datasetTag: string){
      console.log('setting dataset in container coimponent');
    this.chosenDataset = datasetTag;
  }

  backToBrowse() {
      this.chosenDataset = '';
  }

}
