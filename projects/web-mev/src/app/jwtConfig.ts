import { AuthenticationService } from '@app/core/authentication/authentication.service';

export function jwtOptionsFactory(authService: AuthenticationService) {
  return {
    tokenGetter: () => {
      return authService.getJwtToken();
    },
    whitelistedDomains: ['35.194.76.64', 'localhost'],
    blacklistedRoutes: [
      'http://35.194.76.64/api/token/',
      'http://localhost:8000/api/token/'
    ]
  };
}
