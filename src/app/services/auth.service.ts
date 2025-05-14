import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, finalize, catchError, of, map } from 'rxjs';
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
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string>('');

  constructor(private http: HttpClient) {
    const savedUser = this.getUserFromStorage();
    this.currentUserSubject = new BehaviorSubject<User | null>(savedUser);
    this.currentUser = this.currentUserSubject.asObservable();
    
    if (savedUser && this.getToken()) {
      this.validateToken().subscribe({
        error: () => {
          this.logout();
        }
      });
    }
  }

  private getUserFromStorage(): User | null {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('token');
      return null;
    }
  }

  private validateToken(): Observable<boolean> {
    const token = this.getToken();
    if (!token) {
      return of(false);
    }

    return this.http.get<User>(`${environment.apiUrl}/auth/validate`).pipe(
      tap(user => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
      }),
      catchError(() => {
        this.logout();
        return of(false);
      }),
      map(() => true)
    );
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  get loading(): boolean {
    return this.loadingSubject.value;
  }

  get error(): string {
    return this.errorSubject.value;
  }

  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    this.loadingSubject.next(true);
    this.errorSubject.next('');
    
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, credentials).pipe(
      tap(response => {
        if (response.success && response.data.user && response.data.token) {
          localStorage.setItem('currentUser', JSON.stringify(response.data.user));
          localStorage.setItem('token', response.data.token);
          this.currentUserSubject.next(response.data.user);
        }
      }),
      catchError(error => {
        this.errorSubject.next(error.error?.message || 'Error al iniciar sesión');
        throw error;
      }),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
    this.errorSubject.next('');
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.currentUserValue;
    return !!user && !!token;
  }

  isAdmin(): boolean {
    const user = this.currentUserValue;
    return !!user && user.role === 'admin';
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  register(userData: { name: string; email: string; password: string }): Observable<AuthResponse> {
    this.loadingSubject.next(true);
    this.errorSubject.next('');
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, userData)
      .pipe(
        tap(response => {
          if (response.data.user && response.data.token) {
            localStorage.setItem('currentUser', JSON.stringify(response.data.user));
            localStorage.setItem('token', response.data.token);
            this.currentUserSubject.next(response.data.user);
          }
        }),
        catchError(error => {
          this.errorSubject.next(error.message);
          throw error;
        }),
        finalize(() => this.loadingSubject.next(false))
      );
  }

  updateProfile(userData: Partial<User>): Observable<User> {
    this.loadingSubject.next(true);
    this.errorSubject.next('');
    return this.http.put<User>(`${environment.apiUrl}/users/profile`, userData).pipe(
      tap(user => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
      }),
      catchError(error => {
        this.errorSubject.next(error.message);
        throw error;
      }),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    this.loadingSubject.next(true);
    this.errorSubject.next('');
    return this.http.post<void>(`${environment.apiUrl}/users/change-password`, {
      currentPassword,
      newPassword
    }).pipe(
      catchError(error => {
        this.errorSubject.next(error.message);
        throw error;
      }),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  get user(): User | null {
    return this.currentUserSubject.value;
  }
}
