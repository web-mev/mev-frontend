import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe to include only annotation files from the list of all available resources
 */
@Pipe({
  name: 'annotationFilesPipe'
})
export class AnnotationFilesPipe implements PipeTransform {
  transform(value: any): any {
    return value.filter(item => item.resource_type == 'ANN');
  }
}
