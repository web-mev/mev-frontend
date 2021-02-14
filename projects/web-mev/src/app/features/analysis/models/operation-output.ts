import { FileType } from '@app/shared/models/file-type';
import { Injectable } from '@angular/core';

/**
 * Operation Output Specification
 */
export class OutputSpec {
  constructor(public attribute_type: string, public resource_types: FileType) {}
}

/**
 * Operation Output
 *
 * The outputs (another JSON document) once complete, e.g.:
 * "spec":{
 *      "attribute_type": "DataResource",
 *      "resource_type": "FT"
 *  }
 */
export class OperationOutput {
  constructor(public spec: OutputSpec) {}
}

/**
 * Operation Output Adapter
 *
 */
@Injectable({
  providedIn: 'root'
})
export class OperationOutputAdapter {
  adapt(item: any): OperationOutput {
    return new OperationOutput(item.spec);
  }
}
