/**
 * Operation Output
 *
 * The outputs (another JSON document) once complete, e.g.:
 * "spec":{
 *      "attribute_type": "DataResource",
 *      "resource_type": "FT"
 *  }
 */

import { FileType } from '@app/shared/models/file-type';
import { Injectable } from '@angular/core';

export class OutputSpec {
  constructor(public attribute_type: string, public resource_types: FileType) {}
}
export class OperationOutput {
  constructor(public spec: OutputSpec) {}
}

@Injectable({
  providedIn: 'root'
})
export class OperationOutputAdapter {
  adapt(item: any): OperationOutput {
    return new OperationOutput(item.spec);
  }
}
