import { AuthenticationService } from '@app/_services/authentication.service';

export function jwtOptionsFactory(authService: AuthenticationService) {
  return {
    tokenGetter: () => {
      return authService.getJwtToken();
    },
    whitelistedDomains: ['localhost:8000'],
    blacklistedRoutes: ['http://localhost:8000/api/token/']
  };
}
