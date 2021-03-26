import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Workspace } from '@workspace-manager/models/workspace';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import {
  WorkspaceResource,
  WorkspaceResourceAdapter
} from '../models/workspace-resource';
import { File, FileAdapter } from '@app/shared/models/file';

/**
 * Workspace Detail service
 *
 * Used for operations within a current workspace
 */
@Injectable({
  providedIn: 'root'
})
export class WorkspaceDetailService {
  private readonly API_URL = environment.apiUrl;
  constructor(
    private httpClient: HttpClient,
    private fileAdapter: FileAdapter,
    private wsAdapter: WorkspaceResourceAdapter
  ) {}

  /**
   * Get the list of resources that can be potentially added to a workspace
   *
   */
  getAvailableResources(): Observable<File[]> {
    return <Observable<File[]>>(
      this.httpClient
        .get(`${this.API_URL}/resources/`)
        .pipe(
          map((data: any[]) => data.map(item => this.fileAdapter.adapt(item)))
        )
    );
  }

  /**
   * Get the list of connected resources that has been already added to a workspace
   *
   */
  getConnectedResources(workspaceId: string): Observable<WorkspaceResource[]> {
    return <Observable<WorkspaceResource[]>>(
      this.httpClient
        .get(`${this.API_URL}/workspaces/${workspaceId}/resources/`)
        .pipe(
          map((data: any[]) => data.map(item => this.wsAdapter.adapt(item)))
        )
    );
  }

  /**
   * Get workspace properties
   *
   */
  getWorkspaceDetail(workspaceId: number | string): Observable<Workspace> {
    return <Observable<Workspace>>(
      this.httpClient.get(`${this.API_URL}/workspaces/${workspaceId}/`)
    );
  }

  /**
   * Preview workspace resource content. Display only the first 5 rows
   *
   */
  getResourcePreview(resourceId: number | string): Observable<any> {
    const params = {
      params: new HttpParams().set('page', '1').set('page_size', '5')
    };
    return <Observable<any>>(
      this.httpClient.get(
        `${this.API_URL}/resources/${resourceId}/contents/`,
        params
      )
    );
  }

  /**
   * Get workspace resource metadata
   *
   */
  getResourceMetadata(resourceId: number | string): Observable<any> {
    return <Observable<any>>(
      this.httpClient.get(`${this.API_URL}/resources/${resourceId}/metadata/`)
    );
  }

  /**
   * Get workspace metadata
   *
   */
  getWorkspaceMetadata(workspaceId: number | string): Observable<any> {
    return <Observable<any>>(
      this.httpClient.get(`${this.API_URL}/workspaces/${workspaceId}/metadata/`)
    );
  }

  /**
   * Get workspace resource observations
   *
   */
  getResourceMetadataObservations(
    resourceId: number | string
  ): Observable<any> {
    return <Observable<any>>(
      this.httpClient.get(
        `${this.API_URL}/resources/${resourceId}/metadata/observations/`
      )
    );
  }

  /**
   * Get all workspace observations
   *
   */
  getWorkspaceMetadataObservations(
    workspaceId: number | string,
    maxSize: number
  ): Observable<any> {
    const params = {
      params: new HttpParams().set('page_size', '' + maxSize)
    };
    return <Observable<any>>(
      this.httpClient.get(
        `${this.API_URL}/workspaces/${workspaceId}/metadata/observations/`,
        params
      )
    );
  }

  /**
   * Get workspace resource features
   *
   */
  getResourceMetadataFeatures(resourceId: number | string): Observable<any> {
    return <Observable<any>>(
      this.httpClient.get(
        `${this.API_URL}/resources/${resourceId}/metadata/features/`
      )
    );
  }

  /**
   * Get all workspace features
   *
   */
  getWorkspaceMetadataFeatures(workspaceId: number | string): Observable<any> {
    return <Observable<any>>(
      this.httpClient.get(
        `${this.API_URL}/workspaces/${workspaceId}/metadata/features/`
      )
    );
  }

  /**
   * Connect a file to the current workspace
   *
   */
  addResourceToWorkspace(
    resourceId: string,
    workspaceId: string
  ): Observable<any> {
    return <Observable<any>>(
      this.httpClient.post(
        `${this.API_URL}/workspaces/${workspaceId}/resources/add/`,
        { resource_uuid: resourceId }
      )
    );
  }

  /**
   * Delete a file from the current workspace
   *
   */
  deleteResourceFromWorkspace(
    resourceId: string,
    workspaceId: string
  ): Observable<any> {
    return <Observable<any>>(
      this.httpClient.get(
        `${this.API_URL}/workspaces/${workspaceId}/resources/${resourceId}/remove/`
      )
    );
  }
}
