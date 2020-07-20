import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'availableresource'
})
export class AvailableresourcePipe implements PipeTransform {
  transform(value: any): any {
    return value.filter(item => item.workspace === null);
  }
}
