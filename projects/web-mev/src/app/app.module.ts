import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AngularMultiSelectModule } from 'angular2-multiselect-dropdown';
import { BnNgIdleService } from 'bn-ng-idle';
import { NgModule, ErrorHandler } from '@angular/core';

import { CoreModule } from './core/core.module';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app/app.component';
import { JWT_OPTIONS, JwtModule } from '@auth0/angular-jwt';
import { AuthenticationService } from '@app/core/authentication/authentication.service';
import { LoginComponent } from './features/user/login/login.component';
import { RegisterComponent } from './features/user/register/register.component';
import { TutorialComponent } from './features/tutorial/tutorial.component';
import { UserInfoComponent } from './features/user/info/info.component';
import { AuthRedirectComponent } from './features/user/auth-redirect/auth-redirect.component';
import { YouTubePlayerModule } from '@angular/youtube-player';

import { FileManagerModule } from './features/file-manager/file-manager.module';
import { WorkspaceManagerModule } from './features/workspace-manager/workspace-manager.module';
import { PublicDatasetsManagerModule } from './features/public-datasets-manager/public-datasets-manager.module';
import { TokenInterceptor } from '@core/interceptors/token-interceptor.interceptor';

import { SharedModule } from '@app/shared/shared.module';

import {
  SocialLoginModule,
  GoogleLoginProvider,
  SocialAuthServiceConfig
} from 'angularx-social-login';

import { jwtOptionsFactory } from '@app/jwtConfig';
import { HttpErrorInterceptor } from '@core/interceptors/http-error.interceptor';
import { RequestPasswordResetComponent } from './features/user/request-password-reset/request-password-reset.component';
import { ResponsePasswordResetComponent } from './features/user/response-password-reset/response-password-reset.component';
import { PasswordChangeComponent } from './features/user/password-change/password-change.component';
import { SentryErrorHandler } from './sentry-error-handler';

import {environment} from '../../src/environments/environment';
import { MatDialogModule } from '@angular/material/dialog';
import { ContactComponent } from './features/contact-dialog/contact.component';

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

    // app
    FileManagerModule,
    WorkspaceManagerModule,
    PublicDatasetsManagerModule,
    AppRoutingModule,
    MatDialogModule,
  ],
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    TutorialComponent,
    RequestPasswordResetComponent,
    ResponsePasswordResetComponent,
    PasswordChangeComponent,
    ContactComponent,
    AuthRedirectComponent,
    UserInfoComponent
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
    {
      provide: ErrorHandler,
      useClass: SentryErrorHandler
    },
    {
      provide: 'SocialAuthServiceConfig',
      useValue: {
        autoLogin: false,
        providers: [
          {
            id: GoogleLoginProvider.PROVIDER_ID,
            provider: new GoogleLoginProvider(
                environment.googleOAuthClient
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
