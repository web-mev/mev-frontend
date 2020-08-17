import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { File, FileAdapter } from '@app/shared/models/file';
import { Workspace } from '@app/features/workspace-manager/models/workspace';

@Injectable({
  providedIn: 'root'
})
export class AnalysesService {
  private readonly API_URL = environment.apiUrl;
  constructor(
    private httpClient: HttpClient,
    private fileAdapter: FileAdapter
  ) {}

  getWorkspaceDetail(id: number | string): Observable<Workspace> {
    return <Observable<Workspace>>(
      this.httpClient.get(`${this.API_URL}/workspaces/${id}/`)
    );
  }

  getAvailableResourcesByParam(
    types: string[],
    workspaceId: string
  ): Observable<File[]> {
    return <Observable<File[]>>(
      this.httpClient.get<File[]>(`${this.API_URL}/resources/`).pipe(
        map(data =>
          data.filter(
            item =>
              types.includes(item.resource_type) &&
              item.workspace === workspaceId
          )
        ),
        map((data: any[]) => data.map(item => this.fileAdapter.adapt(item)))
      )
    );
  }
}
