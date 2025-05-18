/**
 * Servicio centralizado de autenticación.
 * Gestiona login/registro, perfil, cambio de contraseña y
 * persiste la sesión en localStorage.
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  BehaviorSubject,
  Observable,
  tap,
  finalize,
  catchError,
  of,
  map,
} from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';

interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  /***********************
   * State & observables *
   ***********************/
  private currentUserSubject = new BehaviorSubject<User | null>(
    this.loadUserFromStorage()
  );
  currentUser$ = this.currentUserSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  private errorSubject = new BehaviorSubject<string>('');
  error$ = this.errorSubject.asObservable();

  /************
   * CTOR *
   ************/
  constructor(private http: HttpClient) {
    // Al recargar la página validamos que el token guardado siga siendo válido
    if (this.getToken()) {
      this.validateToken().subscribe(); // si falla, hace logout internamente
    }
  }

  /***********************
   * Métodos de sesión   *
   ***********************/
  /** Login de usuario registrado */
  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    this.setLoading(true);
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(
        tap((res) => this.persistSession(res)),
        catchError((err) => {
          this.errorSubject.next(err.error?.message || 'Error al iniciar sesión');
          throw err;
        }),
        finalize(() => this.setLoading(false))
      );
  }

  /** Registro de nuevo usuario y login automático */
  register(userData: {
    name: string;
    email: string;
    password: string;
  }): Observable<AuthResponse> {
    this.setLoading(true);
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, userData)
      .pipe(
        tap((res) => this.persistSession(res)),
        catchError((err) => {
          this.errorSubject.next(err.error?.message || 'Error al registrarse');
          throw err;
        }),
        finalize(() => this.setLoading(false))
      );
  }

  /** Cerrar sesión */
  logout(): void {
    this.clearSession();
    this.currentUserSubject.next(null);
    this.errorSubject.next('');
  }

  /*******************************
   * Gestiones sobre el usuario  *
   *******************************/
  /** Actualiza nombre / email del perfil propio */
  updateProfile(userData: Partial<User>): Observable<User> {
    this.setLoading(true);
    return this.http
      .put<User>(`${environment.apiUrl}/users/profile`, userData)
      .pipe(
        tap((user) => this.storeUser(user)),
        catchError((err) => {
          this.errorSubject.next(err.error?.message || 'Error al actualizar perfil');
          throw err;
        }),
        finalize(() => this.setLoading(false))
      );
  }

  /** Cambia la contraseña del usuario logueado */
  changePassword(
    currentPassword: string,
    newPassword: string
  ): Observable<void> {
    this.setLoading(true);
    return this.http
      .post<void>(`${environment.apiUrl}/users/change-password`, {
        currentPassword,
        newPassword,
      })
      .pipe(
        catchError((err) => {
          this.errorSubject.next(
            err.error?.message || 'Error al cambiar contraseña'
          );
          throw err;
        }),
        finalize(() => this.setLoading(false))
      );
  }

  /********************************
   * Consultas rápidas de estado  *
   ********************************/
  /** Usuario actualmente almacenado (sincrónico) */
  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  /** ¿Existe usuario + token válidos en memoria? */
  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.currentUserValue;
    
    // Si hay token pero no hay usuario, intentamos cargar el usuario desde localStorage
    if (token && !user) {
      const userFromStorage = this.loadUserFromStorage();
      if (userFromStorage) {
        this.currentUserSubject.next(userFromStorage);
        return true;
      }
    }
    
    return !!token && !!this.currentUserValue;
  }

  /** ¿Rol del usuario es admin? */
  isAdmin(): boolean {
    return this.currentUserValue?.role === 'admin';
  }

  /** Token JWT en storage (o null) */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /*********************
   * utilidades privadas
   *********************/
  /** Valida el token guardado (backend devuelve los datos de usuario) */
  private validateToken(): Observable<boolean> {
    return this.http
      .get<{ success: boolean; data: User }>(
        `${environment.apiUrl}/auth/validate`
      )
      .pipe(
        tap((res) => this.storeUser(res.data)),
        map(() => true),
        catchError((error) => {
          // Solo hacer logout si es un error 401 (no autorizado) o 403 (prohibido)
          if (error.status === 401 || error.status === 403) {
            console.log('Error de autenticación en validateToken:', error);
            this.logout();
          } else {
            // Para otros errores (como problemas de red/CORS), conservar el token
            console.warn('Error en validateToken (no relacionado con autenticación):', error);
            // No llamamos a logout para conservar el token
          }
          return of(false);
        })
      );
  }

  /** Extrae usuario de localStorage (maneja JSON inválido) */
  private loadUserFromStorage(): User | null {
    const raw = localStorage.getItem('currentUser');
    if (!raw) return null;

    try {
      return JSON.parse(raw) as User;
    } catch {
      // Limpia storage corrupto
      localStorage.removeItem('currentUser');
      localStorage.removeItem('token');
      return null;
    }
  }

  /** Guarda usuario + token tras login o registro */
  private persistSession(res: AuthResponse): void {
    if (res.success && res.data?.token && res.data?.user) {
      localStorage.setItem('token', res.data.token);
      this.storeUser(res.data.user);
      this.errorSubject.next('');
    }
  }

  /** Actualiza user en storage + BehaviorSubject */
  private storeUser(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  /** Elimina datos de sesión del storage */
  private clearSession(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
  }

  /** Activa/desactiva indicador de carga */
  private setLoading(state: boolean): void {
    this.loadingSubject.next(state);
  }
}
