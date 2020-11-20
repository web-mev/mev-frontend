import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'validFilesPipe'
})
export class ValidFilesPipe implements PipeTransform {
  /**
   * To link a resource to a workspace, the file should have a valid resource type.
   * To exclude duplicate rows, we filter out the files that already have a workspace linked.
   */
  transform(value: any): any {
    return value.filter(item => item.resource_type && !item.workspace);
  }
}
