import { AuthenticationService } from '@app/_services/authentication.service';

export function jwtOptionsFactory(authService: AuthenticationService) {
  return {
    tokenGetter: () => {
      return authService.getJwtToken();
    },
    whitelistedDomains: ['35.194.76.64'],
    blacklistedRoutes: ['http://35.194.76.64/api/token/']
  };
}
