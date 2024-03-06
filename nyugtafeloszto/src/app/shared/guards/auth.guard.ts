import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';
import { map } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('auth guard!');

  return authService.isLoggedIn().pipe(
    map((user) => {
      if (!user) {
        return router.parseUrl('/home');
      }
      return true;
    })
  );
};
