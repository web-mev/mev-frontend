import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'byteName'
})
export class ByteNamePipe implements PipeTransform {
  transform(bytes: any): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const decimals = 2;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}
