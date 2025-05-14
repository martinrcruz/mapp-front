import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent {
  constructor(
    private router: Router,
    public authService: AuthService
  ) {}

  login() {
    this.router.navigate(['/login']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
