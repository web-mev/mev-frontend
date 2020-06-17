import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {TutorialComponent} from "@features/tutorial/tutorial.component";
import {WorkspaceListComponent} from "@workspace-manager/components/workspace-list/workspace-list.component";

const routes: Routes = [];


@NgModule({
  imports: [
    RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WorkspaceManagerRoutingModule {
}
