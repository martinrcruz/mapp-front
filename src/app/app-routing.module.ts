import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PublicMapComponent } from './components/public-map/public-map.component';
import { LoginComponent } from './components/login/login.component';
import { LocationManagerComponent } from './components/location-manager/location-manager.component';
import { UserManagerComponent } from './components/user-manager/user-manager.component';
import { AdminGuard } from './guards/admin.guard';
import { AdminComponent } from './components/admin/admin.component';
import { LocationBulkImportComponent } from './components/location-bulk-import/location-bulk-import.component';

const routes: Routes = [
  { path: '', component: PublicMapComponent },
  { path: 'login', component: LoginComponent },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [AdminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: PublicMapComponent },
      { path: 'locations', component: LocationManagerComponent },
      { path: 'locations/import', component: LocationBulkImportComponent },
      { path: 'users', component: UserManagerComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
