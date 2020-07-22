import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'availableresource'
})
export class AvailableresourcePipe implements PipeTransform {
  /**
   * To link a resource to a workspace, the file should have a valid resource type.
   * To exclude duplicate rows, we filter out the files that already have a workspace linked.
   */
  transform(value: any): any {
    return value.filter(
      item => item.workspace === null && item.resource_type !== null
    );
  }
}
