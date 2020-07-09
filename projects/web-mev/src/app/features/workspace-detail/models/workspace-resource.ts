import { FileType } from '@app/shared/models/file-type';

export class WorkspaceResource {
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

export const test_workspaceResources: WorkspaceResource[] = [
  {
    id: '1234',
    url: 'url1',
    name: 'File Rawcount.tsv',
    resource_type: FileType.ALN,
    owner_email: 'amnsdbna@gahjsd.co',
    is_active: true,
    is_public: true,
    status: 'some status',
    workspace: 'Workspcae 1',
    created: new Date('2019-01-16'),
    size: 1024,
  },
  {
    id: '1235',
    url: 'url2',
    name: 'File Rawcount 2.tsv',
    resource_type: FileType.BED,
    owner_email: 'ana@gahjsd.co',
    is_active: true,
    is_public: true,
    status: 'some status',
    workspace: 'Workspcae 1',
    created: new Date('2020-01-16'),
    size: 2048,
  },
  {
    id: '1234',
    url: 'url1',
    name: 'File Rawcount.tsv',
    resource_type: FileType.ALN,
    owner_email: 'amnsdbna@gahjsd.co',
    is_active: true,
    is_public: true,
    status: 'some status',
    workspace: 'Workspcae 1',
    created: new Date('2019-01-16'),
    size: 1024,
  },
  {
    id: '1235',
    url: 'url2',
    name: 'File Rawcount 2.tsv',
    resource_type: FileType.BED,
    owner_email: 'ana@gahjsd.co',
    is_active: true,
    is_public: true,
    status: 'some status',
    workspace: 'Workspcae 1',
    created: new Date('2020-01-16'),
    size: 2048,
  },
  {
    id: '1234',
    url: 'url1',
    name: 'File Rawcount.tsv',
    resource_type: FileType.ALN,
    owner_email: 'amnsdbna@gahjsd.co',
    is_active: true,
    is_public: true,
    status: 'some status',
    workspace: 'Workspcae 1',
    created: new Date('2019-01-16'),
    size: 1024,
  }
];
