import { AuthenticationService } from '@app/core/authentication/authentication.service';

export function jwtOptionsFactory(authService: AuthenticationService) {
  return {
    tokenGetter: () => {
      return authService.getJwtToken();
    },
    whitelistedDomains: ['https://api-dev.tm4.org/api', 'localhost'],
    blacklistedRoutes: [
      'https://https://api-dev.tm4.org/api/api/token/',
      'http://localhost:8000/api/token/'
    ]
  };
}
