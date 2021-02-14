export interface Dropbox {
  choose(options: DropboxChooseOptions): void;
}

export interface DropboxChooseOptions {
  linkType: 'direct' | 'preview'; // "direct" is an expiring link to download the contents of the file
  multiselect: boolean;
  extensions?: string[];
  folderselect: boolean;
  success(files: DropboxFile[]); // Required. Called when a user selects an item in the Chooser.
  cancel?(): void; // Optional. Called when the user closes the dialog without selecting a file and does not include any parameters.
}

interface DropboxFile {
  name: string;
  link: string;
  bytes: number;
  icon: string;
  thumbnailLink?: string;
  isDir: boolean;
}
