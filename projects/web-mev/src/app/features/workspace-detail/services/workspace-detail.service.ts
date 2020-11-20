import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Workspace } from '@workspace-manager/models/workspace';
import { map } from 'rxjs/operators';
import { Observable, forkJoin } from 'rxjs';
import {
  WorkspaceResource,
  WorkspaceResourceAdapter
} from '../models/workspace-resource';
import { File, FileAdapter } from '@app/shared/models/file';

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

  getAvailableResources(): Observable<File[]> {
    return <Observable<File[]>>(
      this.httpClient
        .get(`${this.API_URL}/resources/`)
        .pipe(
          map((data: any[]) => data.map(item => this.fileAdapter.adapt(item)))
        )
    );
  }

  getConnectedResources(workspaceId: string): Observable<WorkspaceResource[]> {
    return <Observable<WorkspaceResource[]>>(
      this.httpClient
        .get(`${this.API_URL}/workspaces/${workspaceId}/resources/`)
        .pipe(
          map((data: any[]) => data.map(item => this.wsAdapter.adapt(item)))
        )
    );
  }

  getWorkspaceDetail(workspaceId: number | string): Observable<Workspace> {
    return <Observable<Workspace>>(
      this.httpClient.get(`${this.API_URL}/workspaces/${workspaceId}/`)
    );
  }

  getResourcePreview(resourceId: number | string): Observable<any> {
    const params = {
      params: new HttpParams().set('page', '1').set('page_size', '10')
    };
    return <Observable<any>>(
      this.httpClient.get(
        `${this.API_URL}/resources/${resourceId}/contents/`,
        params
      )
    );
  }

  getResourceMetadata(resourceId: number | string): Observable<any> {
    return <Observable<any>>(
      this.httpClient.get(`${this.API_URL}/resources/${resourceId}/metadata/`)
    );
  }

  getWorkspaceMetadata(workspaceId: number | string): Observable<any> {
    return <Observable<any>>(
      this.httpClient.get(`${this.API_URL}/workspaces/${workspaceId}/metadata/`)
    );
  }

  getResourceMetadataObservations(
    resourceId: number | string
  ): Observable<any> {
    return <Observable<any>>(
      this.httpClient.get(
        `${this.API_URL}/resources/${resourceId}/metadata/observations/`
      )
    );
  }

  getWorkspaceMetadataObservations(
    workspaceId: number | string
  ): Observable<any> {
    return <Observable<any>>(
      this.httpClient.get(
        `${this.API_URL}/workspaces/${workspaceId}/metadata/observations/`
      )
    );
  }

  getResourceMetadataFeatures(resourceId: number | string): Observable<any> {
    return <Observable<any>>(
      this.httpClient.get(
        `${this.API_URL}/resources/${resourceId}/metadata/features/`
      )
    );
  }

  getWorkspaceMetadataFeatures(workspaceId: number | string): Observable<any> {
    return <Observable<any>>(
      this.httpClient.get(
        `${this.API_URL}/workspaces/${workspaceId}/metadata/features/`
      )
    );
  }

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
