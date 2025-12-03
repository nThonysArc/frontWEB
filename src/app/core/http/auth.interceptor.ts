// src/app/core/http/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

// Helper para limpiar sesión de forma segura (solo en navegador)
function clearSession(isBrowser: boolean) {
  if (isBrowser) {
    localStorage.removeItem('authToken');
    localStorage.removeItem('tokenType');
    localStorage.removeItem('tokenExpiration');
    localStorage.removeItem('username');
    localStorage.removeItem('roles');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
  }
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID); // Inyectamos el identificador de la plataforma
  const isBrowser = isPlatformBrowser(platformId); // true si es navegador, false si es servidor

  let token = null;
  let exp = 0;
  const now = Date.now();

  // 1) Lógica de LocalStorage (SOLO SI ES NAVEGADOR)
  if (isBrowser) {
    token = localStorage.getItem('authToken');
    const expStr = localStorage.getItem('tokenExpiration');
    exp = expStr ? Number(expStr) : 0;

    // Verificar expiración en el cliente
    if (token && exp && now > exp) {
      clearSession(true);
      router.navigate(['/auth/login']);
      return throwError(() => new Error('Token expirado en el cliente'));
    }
  }

  // 2) Adjuntar Authorization si hay token válido
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // 3) Manejar errores 401/403 del BACKEND
  return next(authReq).pipe(
    catchError((err) => {
      // Si ocurre un error de auth, limpiamos sesión y redirigimos
      if (err.status === 401 || err.status === 403) {
        clearSession(isBrowser);
        // Usamos router.navigate, que es seguro tanto en servidor como en cliente
        router.navigate(['/auth/login']);
      }
      return throwError(() => err);
    })
  );
};