import { Injectable } from '@angular/core';

export class PublicDataset {
  constructor(
    public id: number,
    public public_name: string,
    public created: Date,
    public description: string,
    public tag: string
  ) {}
}

@Injectable({
  providedIn: 'root',
})
export class PublicDatasetAdapter {
  adapt(item: any): PublicDataset {
    return new PublicDataset(
      item.id, 
      item.public_name, 
      new Date(item.created), 
      item.description,
      item.index_name
      );
  }
}
