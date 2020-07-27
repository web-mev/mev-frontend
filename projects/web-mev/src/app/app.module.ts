import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AngularMultiSelectModule } from 'angular2-multiselect-dropdown';
import { BnNgIdleService } from 'bn-ng-idle';
import { NgModule } from '@angular/core';

import { CoreModule } from './core/core.module';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app/app.component';
import { JWT_OPTIONS, JwtModule } from '@auth0/angular-jwt';
import { AuthenticationService } from '@app/_services/authentication.service';
import { LoginComponent } from './features/user/login/login.component';
import { RegisterComponent } from './features/user/register/register.component';
import { TutorialComponent } from './features/tutorial/tutorial.component';
import { YouTubePlayerModule } from '@angular/youtube-player';

import { WorkareaComponent } from './features/workarea/workarea.component';
import { FileManagerModule } from './features/file-manager/file-manager.module';
import { WorkspaceManagerModule } from './features/workspace-manager/workspace-manager.module';
import { TokenInterceptor } from '@core/interceptors/token-interceptor.interceptor';

import { SharedModule } from '@app/shared/shared.module';

import {
  SocialLoginModule,
  GoogleLoginProvider,
  SocialAuthServiceConfig
} from 'angularx-social-login';

import { jwtOptionsFactory } from '@app/jwtConfig';
import { WorkspaceDetailModule } from '@features/workspace-detail/workspace-detail.module';
import { HttpErrorInterceptor } from '@core/interceptors/http-error.interceptor';
import { RequestPasswordResetComponent } from './features/user/request-password-reset/request-password-reset.component';
import { ResponsePasswordResetComponent } from './features/user/response-password-reset/response-password-reset.component';
import { PasswordChangeComponent } from './features/user/password-change/password-change.component';
import { AnalysesComponent } from './features/analyses/analyses.component';

@NgModule({
  imports: [
    // angular
    BrowserAnimationsModule,
    BrowserModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    AngularMultiSelectModule,

    // core
    CoreModule,

    // app
    FileManagerModule,
    WorkspaceManagerModule,
    AppRoutingModule,

    YouTubePlayerModule,

    SharedModule,

    JwtModule.forRoot({
      jwtOptionsProvider: {
        provide: JWT_OPTIONS,
        useFactory: jwtOptionsFactory,
        deps: [AuthenticationService]
      }
    }),

    // Google authorization
    SocialLoginModule,

    WorkspaceDetailModule
  ],
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    TutorialComponent,
    WorkareaComponent,
    RequestPasswordResetComponent,
    ResponsePasswordResetComponent,
    PasswordChangeComponent,
    AnalysesComponent
  ],
  providers: [
    BnNgIdleService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpErrorInterceptor,
      multi: true
    },

    // SocialLoginModule.initialize(getAuthServiceConfigs)

    // SocialAuthServiceConfig object to set up OAuth2
    // TO DO: Update Client ID in the GoogleLoginProvider()
    {
      provide: 'SocialAuthServiceConfig',
      useValue: {
        autoLogin: false,
        providers: [
          {
            id: GoogleLoginProvider.PROVIDER_ID,
            provider: new GoogleLoginProvider(
              '816319738910-5sap8t0kva0hi9agpcg24ab07g9l54dh.apps.googleusercontent.com' // 'Google ClientId here'
            )
          }
        ]
      } as SocialAuthServiceConfig
    }
  ],
  exports: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
