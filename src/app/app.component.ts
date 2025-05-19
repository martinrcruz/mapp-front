import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { AdminSidebarComponent } from './components/admin-sidebar/admin-sidebar.component';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, AdminSidebarComponent, CommonModule],
  templateUrl: './app.component.html',
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
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
        min-height: calc(100vh - 130px);
        margin-top: 130px;
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
        min-height: calc(100vh - 56px);
        transition: all 0.3s ease;
        overflow-y: auto;
      }

      .main-content.with-sidebar {
        margin-left: 20%;
        width: 80%;
      }
      
      /* Solo aplicar restricción de altura para Public Map */
      .public-map-container {
        height: 100vh;
        overflow: hidden;
      }
    `,
  ],
})
export class AppComponent implements OnInit {
  isAdmin: boolean = false;
  isAuthenticated: boolean = false;
  isPublicMapRoute: boolean = false;

  constructor(public authService: AuthService, private router: Router) {
    // Suscribirse a los cambios del usuario
    this.authService.currentUser$.subscribe(user => {
      this.isAuthenticated = this.authService.isAuthenticated();
      this.isAdmin = this.authService.isAdmin();
    });
    
    // Suscribirse a los cambios de ruta
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      // Actualizar isPublicMapRoute basado en la URL actual
      this.isPublicMapRoute = (event.url === '/' || event.url === '/admin/dashboard');
    });
  }

  ngOnInit() {
    // Verificar el estado inicial
    this.isAuthenticated = this.authService.isAuthenticated();
    this.isAdmin = this.authService.isAdmin();
    // Verificar la ruta inicial
    this.isPublicMapRoute = (this.router.url === '/' || this.router.url === '/admin/dashboard');
  }
}
