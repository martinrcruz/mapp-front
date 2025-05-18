import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { LocationService } from '../../services/location.service';
import { Location } from '../../models/location.model';
import { LocationFormComponent } from '../location-form/location-form.component';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { AlertService } from '../../services/alert.service';

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
  pageSizeOptions = [10, 25, 50];
  total = 0;
  
  // Búsqueda
  searchControl = new FormControl('');

  // Para usar Math en el template
  protected Math = Math;

  constructor(
    private locationService: LocationService,
    private alertService: AlertService
  ) {
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
    this.locationService.getLocations().subscribe({
      next: (response) => {
        this.locations = response.data;
        this.filterLocations(this.searchControl.value || '');
      },
      error: (error) => {
        console.error('Error al cargar ubicaciones:', error);
        this.alertService.error('Error', 'No se pudieron cargar las ubicaciones');
      }
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
    console.log(this.filteredLocations);
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

  onPageSizeChange() {
    this.page = 1; // Reiniciar a la primera página cuando cambia el tamaño de página
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
      next: () => {
        this.loadLocations();
        this.alertService.success('Éxito', 'Estado de la ubicación actualizado correctamente');
      },
      error: (error) => {
        console.error('Error al actualizar el estado:', error);
        location.isActive = !location.isActive; // Revertir cambio en caso de error
        this.alertService.error('Error', 'No se pudo actualizar el estado de la ubicación');
      }
    });
  }

  deleteLocation(locationId: string) {
    this.alertService.confirm('Confirmación', '¿Estás seguro de que deseas eliminar esta ubicación?')
      .then((result) => {
        if (result.isConfirmed) {
          this.locationService.deleteLocation(locationId).subscribe({
            next: () => {
              this.loadLocations();
              this.alertService.success('Éxito', 'Ubicación eliminada correctamente');
            },
            error: (error) => {
              console.error('Error al eliminar la ubicación:', error);
              this.alertService.error('Error', 'No se pudo eliminar la ubicación');
            }
          });
        }
      });
  }

  saveLocation(locationData: any) {
    const request = this.selectedLocation
      ? this.locationService.updateLocation(this.selectedLocation._id, locationData)
      : this.locationService.createLocation(locationData);

    request.subscribe({
      next: () => {
        this.closeModal();
        this.loadLocations();
        const action = this.selectedLocation ? 'actualizada' : 'creada';
        this.alertService.success('Éxito', `Ubicación ${action} correctamente`);
      },
      error: (error) => {
        console.error('Error al guardar la ubicación:', error);
        this.alertService.error('Error', 'No se pudo guardar la ubicación');
      }
    });
  }
} 