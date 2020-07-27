import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { NotificationService } from '@core/notifications/notification.service';
import { Workspace } from '@workspace-manager/models/workspace';
import { catchError, retry, map } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
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

  getWorkspaceDetail(id: number | string): Observable<Workspace> {
    return <Observable<Workspace>>(
      this.httpClient.get(`${this.API_URL}/workspaces/${id}/`)
    );
  }

  getResourcePreview(id: number | string): Observable<any> {
    return <Observable<Workspace>>(
      this.httpClient.get(`${this.API_URL}/resources/${id}/preview/`)
    );
  }

  addResourceToWorkspace(
    resource_uuid: string,
    workspaceId: string
  ): Observable<any> {
    return <Observable<any>>(
      this.httpClient.post(
        `${this.API_URL}/workspaces/${workspaceId}/resources/add/`,
        { resource_uuid: resource_uuid }
      )
    );
  }
}
