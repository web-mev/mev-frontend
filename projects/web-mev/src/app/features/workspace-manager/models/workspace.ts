import { Injectable } from '@angular/core';

export class Workspace {
  constructor(
    public id: string,
    public workspace_name: string,
    public created: Date,
    public url: string,
    public owner_email: string
  ) {}
}

@Injectable({
  providedIn: 'root',
})
export class WorkspaceAdapter {
  adapt(item: any): Workspace {
    return new Workspace(
      item.id, 
      item.workspace_name, 
      new Date(item.created), 
      item.url,
      item.owner_email
    );
  }
}
