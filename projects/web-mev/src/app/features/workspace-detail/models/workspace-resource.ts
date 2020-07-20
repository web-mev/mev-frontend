import { FileType } from '@app/shared/models/file-type';
import { Injectable } from '@angular/core';

export class WorkspaceResource {
  constructor(
    public id: string,
    public url: string,
    public name: string,
    public resource_type: FileType,
    public readable_resource_type: string,
    public owner_email: string,
    public is_active: boolean,
    public is_public: boolean,
    public status: string,
    public workspace: string,
    public workspace_name: string,
    public created: Date,
    public size: number
  ) {}
}

@Injectable({
  providedIn: 'root'
})
export class WorkspaceResourceAdapter {
  adapt(item: any): WorkspaceResource {
    const re = /[()]/g;
    const created_formatted = item.created.replace(re, '');

    return new WorkspaceResource(
      item.id,
      item.url,
      item.name,
      item.resource_type,
      item.readable_resource_type,
      item.owner_email,
      item.is_active,
      item.is_public,
      item.status,
      item.workspace,
      item.workspace_name,
      new Date(created_formatted),
      item.size
    );
  }
}
