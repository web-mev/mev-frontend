import { FileType } from '@app/features/file-manager/models/file-type';

export interface File {
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
