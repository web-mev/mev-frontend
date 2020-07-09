import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { NgModule } from '@angular/core';

import { CoreModule } from './core/core.module';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app/app.component';
import { JWT_OPTIONS, JwtModule } from '@auth0/angular-jwt';

import { AuthService } from '@app/shared/auth/auth.service';
import { AuthenticationService } from '@app/_services/authentication.service';
import { LoginComponent } from './features/login/login.component';
import { RegisterComponent } from './features/register/register.component';
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
import { RequestPasswordResetComponent } from './features/request-password-reset/request-password-reset.component';
import { ResponsePasswordResetComponent } from './features/response-password-reset/response-password-reset.component';


// export function jwtOptionsFactory(authService: AuthenticationService) {
//   return {
//     tokenGetter: () => {
//       return authService.getJwtToken();
//     },
//     whitelistedDomains: ['localhost:8000'],
//     blacklistedRoutes: ['http://localhost:8000/api/token/']
//   };
// }



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
    
  ],
  providers: [
    AuthService,

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
              '624796833023-clhjgupm0pu6vgga7k5i5bsfp6qp6egh.apps.googleusercontent.com' // 'Google ClientId here!!'
            ),
          }
        ],
      } as SocialAuthServiceConfig,
    }

  ],
  exports: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
