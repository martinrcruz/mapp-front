import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { AdminSidebarComponent } from './components/admin-sidebar/admin-sidebar.component';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, AdminSidebarComponent, CommonModule],
  templateUrl: './app.component.html',
  styles: [
    `
      :host {
        display: block;
        height: 100vh;
        overflow: hidden;
      }

      .navbar {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 130px;
        z-index: 1030;
      }

      .d-flex {
        height: calc(100vh - 130px);
        margin-top: 130px;
        overflow: hidden;
      }

      .sidebar {
        width: 20%;
        position: fixed;
        left: 0;
        top: 56px;
        bottom: 0;
        background-color: #f8f9fa;
        border-right: 1px solid #dee2e6;
        z-index: 1020;
        overflow-y: auto;
      }

      .main-content {
        width: 100%;
        height: calc(100vh - 56px);
        transition: all 0.3s ease;
        overflow: hidden;
      }

      .main-content.with-sidebar {
        margin-left: 20%;
        width: 80%;
      }
    `,
  ],
})
export class AppComponent implements OnInit {
  isAdmin: boolean = false;
  isAuthenticated: boolean = false;

  constructor(public authService: AuthService) {
    // Suscribirse a los cambios del usuario
    this.authService.currentUser$.subscribe(user => {
      this.isAuthenticated = this.authService.isAuthenticated();
      this.isAdmin = this.authService.isAdmin();
    });
  }

  ngOnInit() {
    // Verificar el estado inicial
    this.isAuthenticated = this.authService.isAuthenticated();
    this.isAdmin = this.authService.isAdmin();
  }
}
