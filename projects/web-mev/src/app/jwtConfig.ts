import { AuthenticationService } from '@app/_services/authentication.service';

export function jwtOptionsFactory(authService: AuthenticationService) {
  return {
    tokenGetter: () => {
      return authService.getJwtToken();
    },
    whitelistedDomains: ['35.245.92.162'],
    blacklistedRoutes: ['http://35.245.92.162/api/token/']
  };
}
