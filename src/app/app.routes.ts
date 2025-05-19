import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/public-map/public-map.component').then(
        m => m.PublicMapComponent
      ),
  },
  {
    path: 'login',
    loadComponent: () => 
      import('./components/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'admin',
    loadComponent: () => 
      import('./components/admin/admin.component').then(m => m.AdminComponent),
    canActivate: [AdminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { 
        path: 'dashboard', 
        loadComponent: () =>
          import('./components/public-map/public-map.component').then(
            m => m.PublicMapComponent
          ),
      },
      { 
        path: 'locations', 
        loadComponent: () =>
          import('./components/location-manager/location-manager.component').then(
            m => m.LocationManagerComponent
          ),
      },
      { 
        path: 'locations/import', 
        loadComponent: () =>
          import('./components/location-bulk-import/location-bulk-import.component').then(
            m => m.LocationBulkImportComponent
          ),
      },
      { 
        path: 'users', 
        loadComponent: () =>
          import('./components/user-manager/user-manager.component').then(
            m => m.UserManagerComponent
          ),
      }
    ]
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./components/register/register.component').then(m => m.RegisterComponent),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./components/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [AuthGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
