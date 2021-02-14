import { Injectable } from '@angular/core';

/**
 * Operation Input Specification
 *
 * Contains properties for dfferent types of operations
 *       "spec": {
 *           "attribute_type": "DataResource",
 *           "resource_types": ["RNASEQ_COUNT_MTX", "I_MTX"],
 *           "many": false
 *       }
 *    }
 */
export class InputSpec {
  constructor(
    public attribute_type: string,
    public resource_types?: string[],
    public many?: boolean,
    public min?: number,
    public max?: number,
    public default_value?: number | string,
    public options?: string[]
  ) {}
}

/**
 * Operation Input.
 *
 * The inputs to the analysis (a JSON document), e.g.:
 *
 *    {
 *       "description": "The count matrix of expressions",
 *       "name": "Count matrix:",
 *       "required": true,
 *       "spec": {
 *           "attribute_type": "DataResource",
 *           "resource_types": ["RNASEQ_COUNT_MTX", "I_MTX"],
 *           "many": false
 *       }
 *    }
 */

export class OperationInput {
  constructor(
    public description: string,
    public name: string,
    public required: boolean,
    public spec: InputSpec
  ) {}
}

/**
 * Operation Input Adapter
 *
 */
@Injectable({
  providedIn: 'root'
})
export class OperationInputAdapter {
  adapt(item: any): OperationInput {
    const spec = new InputSpec(
      item.spec.attribute_type,
      item.spec.resource_types,
      item.spec.many,
      item.spec.min,
      item.spec.max,
      item.spec.default,
      item.spec.options
    );

    return new OperationInput(item.description, item.name, item.required, spec);
  }
}
