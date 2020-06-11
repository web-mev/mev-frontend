import { FileType } from '@app/features/file-manager/models/file-type';

/**
 * File or Resource
 *
 * Resource instance is created when MEV users upload files.
 * Resource instances are initially "unattached" meaning they are associated with their owner,
 * but have not been associated with any user workspaces.
 * Admins can, however, specify a Workspace in their request to create the Resource directly via the API.
 */

export class File {
  id: string;
  url: string;
  name: string;
  resource_type: FileType;
  owner_email: string;
  is_active: boolean;
  is_public: boolean;
  status: string;
  workspace: string;
  created: Date;
  size: number;
}
