import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { NgModule } from '@angular/core';

import { CoreModule } from './core/core.module';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app/app.component';
import { AuthService } from '@app/shared/auth/auth.service';
import { ApiService } from '@app/_services/api.service';
import { LoginComponent } from './features/login/login.component';
import { RegisterComponent } from './features/register/register.component';
import { TutorialComponent } from './features/tutorial/tutorial.component';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { YouTubePlayerModule } from '@angular/youtube-player';

import { WorkareaComponent } from './features/workarea/workarea.component';
import { FileManagerModule } from './features/file-manager/file-manager.module';
import { WorkspaceManagerModule } from './features/workspace-manager/workspace-manager.module';

@NgModule({
  imports: [
    // angular
    BrowserAnimationsModule,
    BrowserModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,

    // core
    CoreModule,

    // app
    FileManagerModule,
    WorkspaceManagerModule,
    AppRoutingModule,

    // material
    MatCardModule,
    MatInputModule,
    YouTubePlayerModule,
    MatIconModule,
    MatTabsModule
  ],
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    TutorialComponent,
    WorkareaComponent
  ],
  providers: [ApiService, AuthService],
  exports: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
