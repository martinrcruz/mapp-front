import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (this.authService.isAuthenticated() && this.authService.isAdmin()) {
      return true;
    }

    this.router.navigate(['/login']);
    return false;
  }
} 