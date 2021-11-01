import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DataSource } from '@angular/cdk/collections';
import { BehaviorSubject, fromEvent, merge, Observable } from 'rxjs';
import { map, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

import { PublicDatasetService } from '../../services/public-datasets.service';
import { PublicDataset } from '../../models/public-dataset';

@Component({
  selector: 'mev-public-datasets-list',
  templateUrl: './public-datasets-list.component.html',
  styleUrls: ['./public-datasets-list.component.scss']
})
export class PublicDatasetsListComponent implements OnInit {

  publicDatasets: [];

  constructor(
    public pdService: PublicDatasetService
  ) {}

  ngOnInit() {
    console.log('in init...');
    this.loadData();
  }

  public loadData() {
    console.log('load...');
    this.pdService.getPublicDatasets().subscribe(
      data => {
        this.publicDatasets = data;
      }
    );
  }

}
