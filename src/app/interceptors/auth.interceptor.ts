import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getToken();

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(req).pipe(
    catchError(error => {
      if (error.status) {
        if (error.status === 401) {
          console.log('Error 401 Unauthorized interceptado:', error);
          authService.logout();
          router.navigate(['/login']);
        }
      } else {
        console.warn('Error de red en interceptor:', error);
      }
      return throwError(() => error);
    })
  );
};
