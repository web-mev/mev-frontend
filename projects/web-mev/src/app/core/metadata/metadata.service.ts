import { Injectable } from '@angular/core';
import { CustomSet, CustomSetType } from '@app/_models/metadata';
import { ActivatedRoute, Router } from '@angular/router';
import { LclStorageService } from '../local-storage/lcl-storage.service';

@Injectable({
  providedIn: 'root'
})
export class MetadataService {
  result: string;

  constructor(private router: Router, private storage: LclStorageService) {}

  /**
   * Traverses a router tree from root to a leaf looking for {@param}.
   */
  getParam(param: string): string | null {
    for (const route of this.getCurrentRoutesChain()) {
      if (route.snapshot.paramMap.has(param)) {
        return route.snapshot.paramMap.get(param);
      }
    }
    return null;
  }

  /**
   * Retrieves a chain of {ActivatedRoutes} from root to a leaf.
   */
  getCurrentRoutesChain(): ActivatedRoute[] {
    let currentRoute = this.router.routerState.root;
    const results: ActivatedRoute[] = [currentRoute];

    while (currentRoute.firstChild) {
      currentRoute = currentRoute.firstChild;
      results.push(currentRoute);
    }

    return results;
  }

  /**
   * Get all custom observation and feature sets from user's storage
   */
  getCustomSets(): CustomSet[] {
    const workspaceId = this.getParam('workspaceId'); //this.route.snapshot.paramMap.get('workspaceId');
    return this.storage.get(workspaceId + '_custom_sets') || [];
  }

  /**
   * Get custom observation sets from user's storage
   */
  getCustomObservationSets(): CustomSet[] {
    const customSets = this.getCustomSets();
    return customSets.filter(set => set.type === CustomSetType.ObservationSet);
  }

  /**
   * Get all custom feature sets from user's storage
   */
  getCustomFeatureSets(): CustomSet[] {
    const customSets = this.getCustomSets();
    return customSets.filter(set => set.type === CustomSetType.FeatureSet);
  }

  /**
   * Add a new custom observation/feature set to user's storage
   */
  addCustomSet(customSet: CustomSet): void {
    const customSets = this.getCustomSets();
    customSets.push(customSet);
    const workspaceId = this.getParam('workspaceId');
    this.storage.set(workspaceId + '_custom_sets', customSets);
  }

  /**
   * Add a new custom observation/feature set to user's storage
   */
  deleteCustomSet(customSetId: string): void {
    const customSets = this.getCustomSets();
    const foundIndex = customSets.findIndex(set => set.name === customSetId);
    customSets.splice(foundIndex, 1);
    const workspaceId = this.getParam('workspaceId');
    this.storage.set(workspaceId + '_custom_sets', customSets);
  }
}