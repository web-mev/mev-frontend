import { Injectable } from '@angular/core';
import { OperationInput, OperationInputAdapter } from './operation-input';
import { OperationOutput } from './operation-output';

/**
 * Operation
 *
 * An Operation is any manipulation of some data that produces some output;
 * it defines the type of analysis that is run, its inputs and outputs,
 * and other relevant information. An Operation can be as simple as selecting a subset
 * of the columns/rows of a matrix or running a large-scale processing job
 * that spans many machines and significant time. */

export class Operation {
  constructor(
    public id: string,
    public name: string,
    public description: string,
    public inputs: Record<string, OperationInput>,
    public outputs: Record<string, OperationOutput>,
    public mode: string,
    public repository: string,
    public git_hash: string
  ) {}
}

@Injectable({
  providedIn: 'root'
})
export class OperationAdapter {
  adapt(item: any): Operation {
    const inputs = item.inputs;
    Object.keys(inputs).map(function(key, index) {
      inputs[key] = new OperationInputAdapter().adapt(inputs[key]);
    });

    return new Operation(
      item.id,
      item.name,
      item.description,
      inputs,
      item.outputs,
      item.mode,
      item.repository,
      item.git_hash
    );
  }
}
