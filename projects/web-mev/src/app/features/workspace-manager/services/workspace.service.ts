import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Workspace, WorkspaceAdapter } from '../models/workspace';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceService {
  private readonly API_URL = environment.apiUrl + '/workspaces';

  dataChange: BehaviorSubject<Workspace[]> = new BehaviorSubject<Workspace[]>(
    []
  );

  // Temporarily stores data from dialogs
  dialogData: any;

  constructor(
    private httpClient: HttpClient,
    private adapter: WorkspaceAdapter
  ) {}

  get data(): Workspace[] {
    return this.dataChange.value;
  }

  getDialogData() {
    return this.dialogData;
  }

  getAllWorkspaces(): void {
    this.httpClient
      .get<Workspace[]>(`${this.API_URL}/`)
      .pipe(map((data: any[]) => data.map(item => this.adapter.adapt(item))))
      .subscribe(data => {
        this.dataChange.next(data);
      });
  }

  // ADD, POST METHOD
  addWorkspace(workspace: Workspace): Observable<any> {
    return this.httpClient.post(`${this.API_URL}/`, workspace);
  }

  // UPDATE, PUT METHOD
  updateWorkspace(workspace: Workspace): void {
    this.httpClient
      .put(`${this.API_URL}/${workspace.id}/`, workspace)
      .subscribe(data => {
        this.dialogData = workspace;
      });
  }

  // DELETE METHOD
  deleteWorkspace(id: number): void {
    this.httpClient.delete(`${this.API_URL}/${id}/`).subscribe();
  }
}
