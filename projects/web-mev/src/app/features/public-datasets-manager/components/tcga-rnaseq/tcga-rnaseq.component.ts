import {
    Component,
    OnInit
   
  } from '@angular/core';
  

  @Component({
    selector: 'tcga-rnaseq-explorer',
    templateUrl: './tcga-rnaseq.component.html',
    styleUrls: ['./tcga-rnaseq.component.scss']
  })
  export class TcgaRnaseqComponent implements OnInit {
    ngOnInit(): void {
        console.log('in rnaseq init...');
    }
  }