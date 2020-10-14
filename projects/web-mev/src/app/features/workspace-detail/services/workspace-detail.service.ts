import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { HttpClient } from '@angular/common/http';
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
    return <Observable<any>>(
      this.httpClient.get(`${this.API_URL}/resources/${resourceId}/preview/`)
    );
  }

  getMetadata(resourceId: number | string): Observable<any> {
    return <Observable<any>>(
      this.httpClient.get(`${this.API_URL}/resources/${resourceId}/metadata/`)
    );
  }

  getMetadataForResources(resources): Observable<any> {
    const metadataObservables = resources.map(resource => {
      return this.getMetadata(resource.id).pipe(
        map(metadata => {
          return metadata;
        })
      );
    });
    return forkJoin(metadataObservables);
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
}
