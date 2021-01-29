import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'annotationFilesPipe'
})
export class AnnotationFilesPipe implements PipeTransform {
  /**
   * To include only annotation files from the list of all available resources
   */
  transform(value: any): any {
    return value.filter(item => item.resource_type == 'ANN');
  }
}
