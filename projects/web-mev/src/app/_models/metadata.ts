/**
 * Custom set types
 *
 */

export enum CustomSetType {
  ObservationSet = 'Observation set',
  FeatureSet = 'Feature set'
}

/**
 * Custom set element
 *
 */

export interface CustomSetElement {
  id: string;
  attributes?: [];
}

/**
 * Custom set
 *
 */

export interface CustomSet {
  name: string;
  color: string;
  type: CustomSetType;
  elements: CustomSetElement[];
  multiple: boolean;
}
