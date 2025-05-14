import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    return this.http.get<ApiResponse<User[]>>(`${environment.apiUrl}/users`).pipe(
      map(response => response.data)
    );
  }

  getUser(id: string): Observable<User> {
    return this.http.get<ApiResponse<User>>(`${environment.apiUrl}/users/${id}`).pipe(
      map(response => response.data)
    );
  }

  createUser(user: User): Observable<User> {
    return this.http.post<ApiResponse<User>>(`${environment.apiUrl}/users`, user).pipe(
      map(response => response.data)
    );
  }

  updateUser(id: string, user: User): Observable<User> {
    return this.http.put<ApiResponse<User>>(`${environment.apiUrl}/users/${id}`, user).pipe(
      map(response => response.data)
    );
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/users/${id}`);
  }
} 