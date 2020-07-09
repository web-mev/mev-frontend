import { Injectable } from '@angular/core';
import { FileType } from '@app/shared/models/file-type';

/**
 * File or Resource
 *
 * Resource instance is created when MEV users upload files.
 * Resource instances are initially "unattached" meaning they are associated with their owner,
 * but have not been associated with any user workspaces.
 * Admins can, however, specify a Workspace in their request to create the Resource directly via the API.
 */

export class File {

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
    public created: Date,
    public size: number    
  ) {}
}

@Injectable({
  providedIn: 'root',
})
export class FileAdapter {
  adapt(item: any): File {
    
    const re = /[()]/g;
    const created_formatted = item.created.replace(re, '');

    return new File(
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
      new Date(created_formatted),
      item.size)
  }
}