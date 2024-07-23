import { Component, OnInit, EventEmitter, Output, Input } from '@angular/core';

@Component({
  selector: 'mev-gene-search-input-field',
  templateUrl: './gene-search-input-field.component.html',
  styleUrls: ['./gene-search-input-field.component.scss']
})
export class GeneSearchInputFieldComponent implements OnInit {
  @Input() initialGeneVal
  @Output() searchSubmit: EventEmitter<void> = new EventEmitter<void>();

  geneSearchVal;
  geneSearch;

  ngOnInit(): void {
    this.geneSearchVal = this.initialGeneVal
  }

  onSubmit() {
    this.geneSearch = (this.geneSearchVal.slice(0, 3).toLowerCase() === 'ens') ? this.geneSearchVal.toUpperCase() : this.geneSearchVal;
    this.searchSubmit.emit(this.geneSearch);
  }

}