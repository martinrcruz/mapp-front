import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Location } from '../../models/location.model';
import { LocationService } from '../../services/location.service';
import { LocationFormComponent } from '../location-form/location-form.component';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, AdminSidebarComponent],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
})
export class AdminComponent implements OnInit {
  constructor(
    public locationService: LocationService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.locationService.loadLocations();
  }

  openLocationForm(location?: Location): void {
    const modalRef = this.modalService.open(LocationFormComponent, {
      size: 'lg',
      backdrop: 'static',
    });

    if (location) {
      modalRef.componentInstance.location = location;
    }

    modalRef.result.then(
      result => {
        if (result) {
          if (location) {
            this.locationService.updateLocation(location._id, result).subscribe();
          } else {
            this.locationService.createLocation(result).subscribe();
          }
        }
      },
      () => {}
    );
  }

  toggleLocationStatus(location: Location): void {
    this.locationService
      .updateLocation(location._id, {
        isActive: !location.isActive,
      })
      .subscribe();
  }

  deleteLocation(location: Location): void {
    if (confirm('¿Está seguro de eliminar esta ubicación?')) {
      this.locationService.deleteLocation(location._id).subscribe();
    }
  }

  handleError(error: Error): void {
    console.error('Error:', error);
    // Implementar manejo de errores específico aquí
  }
}
