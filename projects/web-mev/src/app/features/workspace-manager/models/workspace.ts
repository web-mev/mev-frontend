import { Injectable } from '@angular/core';

export class Workspace {
  constructor(
    public id: string,
    public workspace_name: string,
    public created: Date,
    public url: string
  ) {}
}

@Injectable({
  providedIn: 'root',
})
export class WorkspaceAdapter {
  adapt(item: any): Workspace {
    const re = /[()]/g;
    const created_formatted = item.created.replace(re, '');
    return new Workspace(
      item.id, 
      item.workspace_name, 
      new Date(created_formatted), 
      item.url
      );
  }
}
