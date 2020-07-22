/**
 * File types
 *
 * These types are restricted to a set of common file formats.
 */

export class FileType {
  resource_type_key: string;
  resource_type_title: string;
  resource_type_description: string;

  constructor(
    options: {
      resource_type_key?: string;
      resource_type_title?: string;
      resource_type_description?: string;
    } = {}
  ) {
    this.resource_type_key = options.resource_type_key;
    this.resource_type_title = options.resource_type_title;
    this.resource_type_description = options.resource_type_description;
  }
}
