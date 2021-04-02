import { Injectable } from '@angular/core';
import { CustomSet, CustomSetType } from '@app/_models/metadata';
import { ActivatedRoute, Router } from '@angular/router';
import { LclStorageService } from '../local-storage/lcl-storage.service';
import { NotificationService } from '../core.module';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { HttpClient } from '@angular/common/http';
/**
 * Metadata service
 *
 * Used for operations with workspace metadata (observation and feature sets defined in workspace)
 * Uses local storage to save custom observation and feature sets
 */
@Injectable({
  providedIn: 'root'
})
export class MetadataService {
  result: string;
  private readonly API_URL = environment.apiUrl;

  constructor(
    private router: Router,
    private storage: LclStorageService,
    private readonly notificationService: NotificationService,
    private httpClient: HttpClient,
  ) {}

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
  addCustomSet(customSet: CustomSet, showMsg = true): boolean {
    const customSets = this.getCustomSets();
    if (customSets.some(set => set.name === customSet.name)) {
      const errorMessage =
        'The observation/feature set with this name already exists.';
      this.notificationService.error(errorMessage);
      return false;
    } else {
      customSets.push(customSet);
      const workspaceId = this.getParam('workspaceId');
      this.storage.set(workspaceId + '_custom_sets', customSets);
      if (showMsg){
        this.notificationService.success(
          'The new custom set has been successfully created.'
        );
      }
      return true;
    }
  }

  /**
   * Add a new custom observation/feature set to user's storage
   */
  updateCustomSet(customSet: CustomSet, oldCustomSetId: string): boolean {
    const customSets = this.getCustomSets();

    if (
      customSet.name !== oldCustomSetId &&
      customSets.some(set => set.name === customSet.name)
    ) {
      const errorMessage =
        'The observation/feature set with this name already exists.';
      this.notificationService.error(errorMessage);
      return false;
    } else {
      const foundIndex = customSets.findIndex(
        set => set.name === oldCustomSetId
      );
      customSets[foundIndex] = { ...customSets[foundIndex], ...customSet }; //customSet;
      const workspaceId = this.getParam('workspaceId');
      this.storage.set(workspaceId + '_custom_sets', customSets);
      this.notificationService.success(
        'The custom set has been successfully updated.'
      );
      return true;
    }
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


  intersectCustomSets(payload): Observable<any> {
    return <Observable<any>>(
      this.httpClient.post(
        `${this.API_URL}/metadata/intersect/`,
        payload
      )
    );
  }

  unionCustomSets(payload): Observable<any> {
    return <Observable<any>>(
      this.httpClient.post(
        `${this.API_URL}/metadata/union/`,
        payload
      )
    );
  }

  differenceCustomSets(payload): Observable<any> {
    return <Observable<any>>(
      this.httpClient.post(
        `${this.API_URL}/metadata/set-difference/`,
        payload
      )
    );
  }
}
