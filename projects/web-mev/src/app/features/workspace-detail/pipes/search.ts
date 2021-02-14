import { Pipe, PipeTransform } from '@angular/core';
import { WorkspaceResource } from '@features/workspace-detail/models/workspace-resource';
const { isArray } = Array;

/**
 * Pipe for text searching
 */
@Pipe({
  name: 'filter'
})
export class FilterPipe implements PipeTransform {
  transform(resources: WorkspaceResource[], find: string): WorkspaceResource[] {
    if (!resources) return [];
    if (!find) return resources;
    find = find.toLowerCase();
    return search(resources, find);
  }
}

function search(entries: any[], search: string) {
  search = search.toLowerCase();

  return entries.filter(function(obj) {
    const keys: string[] = Object.keys(obj);
    return keys.some(function(key) {
      const value = obj[key];
      if (isArray(value)) {
        return value.some(v => {
          return v.toLowerCase().includes(search);
        });
      } else if (!isArray(value)) {
        return String(value)
          .toLowerCase()
          .includes(search);
      }
    });
  });
}
