import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { LocationService } from '../../services/location.service';
import { Location } from '../../models/location.model';
import { LocationFormComponent } from '../location-form/location-form.component';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-location-manager',
  templateUrl: './location-manager.component.html',
  styleUrls: ['./location-manager.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule,
    LocationFormComponent,
    NgbPaginationModule
  ]
})
export class LocationManagerComponent implements OnInit {
  locations: Location[] = [];
  filteredLocations: Location[] = [];
  selectedLocation: Location | undefined = undefined;
  showModal = false;
  
  // Paginación
  page = 1;
  pageSize = 10;
  total = 0;
  
  // Búsqueda
  searchControl = new FormControl('');

  // Para usar Math en el template
  protected Math = Math;

  constructor(private locationService: LocationService) {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      this.filterLocations(value || '');
    });
  }

  ngOnInit() {
    this.loadLocations();
  }

  loadLocations() {
    this.locationService.getLocations().subscribe(response => {
      this.locations = response.data;
      this.filterLocations(this.searchControl.value || '');
    });
  }

  filterLocations(searchTerm: string) {
    if (!searchTerm) {
      this.filteredLocations = [...this.locations];
    } else {
      const term = searchTerm.toLowerCase();
      this.filteredLocations = this.locations.filter(location => 
        location.name.toLowerCase().includes(term) ||
        location.address?.street?.toLowerCase().includes(term) ||
        location.address?.city?.toLowerCase().includes(term) ||
        location.address?.state?.toLowerCase().includes(term) ||
        location.address?.country?.toLowerCase().includes(term) ||
        location.type.toLowerCase().includes(term)
      );
    }
    this.total = this.filteredLocations.length;
    this.page = 1;
  }

  get paginatedLocations() {
    const startIndex = (this.page - 1) * this.pageSize;
    return this.filteredLocations.slice(startIndex, startIndex + this.pageSize);
  }

  onPageChange(page: number) {
    this.page = page;
  }

  openAddModal() {
    this.selectedLocation = undefined;
    this.showModal = true;
  }

  openEditModal(location: Location) {
    this.selectedLocation = location;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedLocation = undefined;
  }

  toggleLocationStatus(location: Location) {
    location.isActive = !location.isActive;
    this.locationService.updateLocation(location._id, location).subscribe({
      next: () => this.loadLocations(),
      error: (error) => {
        console.error('Error al actualizar el estado:', error);
        location.isActive = !location.isActive; // Revertir cambio en caso de error
      }
    });
  }

  deleteLocation(locationId: string) {
    if (confirm('¿Estás seguro de que deseas eliminar esta ubicación?')) {
      this.locationService.deleteLocation(locationId).subscribe({
        next: () => this.loadLocations(),
        error: (error) => {
          console.error('Error al eliminar la ubicación:', error);
          alert('No se pudo eliminar la ubicación. Por favor, inténtalo de nuevo.');
        }
      });
    }
  }

  saveLocation(locationData: any) {
    const request = this.selectedLocation
      ? this.locationService.updateLocation(this.selectedLocation._id, locationData)
      : this.locationService.createLocation(locationData);

    request.subscribe({
      next: () => {
        this.closeModal();
        this.loadLocations();
      },
      error: (error) => {
        console.error('Error al guardar la ubicación:', error);
        alert('No se pudo guardar la ubicación. Por favor, inténtalo de nuevo.');
      }
    });
  }
} 