import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-sidebar',
  templateUrl: './admin-sidebar.component.html',
  styleUrls: ['./admin-sidebar.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class AdminSidebarComponent {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
} 