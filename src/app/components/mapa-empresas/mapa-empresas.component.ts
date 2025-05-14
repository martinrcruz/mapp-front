import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as mapboxgl from 'mapbox-gl';
import { environment } from '../../../environments/environment';
import { Location } from '../../models/location.model';
import { LocationService } from '../../services/location.service';
import { LocationFormComponent } from '../location-form/location-form.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-mapa-empresas',
  standalone: true,
  imports: [CommonModule, FormsModule, LocationFormComponent],
  templateUrl: './mapa-empresas.component.html',
  styleUrls: ['./mapa-empresas.component.scss'],
})
export class MapaEmpresasComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  private map!: mapboxgl.Map;
  private markers: mapboxgl.Marker[] = [];

  constructor(
    public locationService: LocationService,
    public authService: AuthService,
    private modalService: NgbModal
  ) {
    (mapboxgl as any).accessToken = environment.mapboxToken;

    // Usar effect para reaccionar a cambios en las ubicaciones
    effect(() => {
      const locations = this.locationService.locations();
      if (locations && this.map) {
        this.updateMarkers(locations);
      }
    });
  }

  ngOnInit(): void {
    // Cargar ubicaciones al inicio
    this.locationService.loadLocations();
  }

  ngAfterViewInit(): void {
    this.initializeMap();
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.markers.forEach(marker => marker.remove());
  }

  private initializeMap(): void {
    if (this.mapContainer && this.mapContainer.nativeElement) {
      this.map = new mapboxgl.Map({
        container: this.mapContainer.nativeElement,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: environment.defaultMapCenter as [number, number],
        zoom: environment.defaultMapZoom,
      });

      this.map.on('load', () => {
        this.map.addControl(new mapboxgl.NavigationControl());
        // Actualizar marcadores después de que el mapa esté cargado
        const locations = this.locationService.locations();
        if (locations) {
          this.updateMarkers(locations);
        }
      });
    }
  }

  private updateMarkers(locations: Location[]): void {
    if (!this.map) return;

    // Limpiar marcadores existentes
    this.markers.forEach(marker => marker.remove());
    this.markers = [];

    // Crear nuevos marcadores
    locations.forEach(location => {
      if (location.coordinates && location.coordinates.coordinates) {
        const [lng, lat] = location.coordinates.coordinates;

        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div class="popup-content">
            <h6>${location.name}</h6>
            <p class="mb-1">${location.address.street}, ${location.address.city}</p>
            <p class="mb-1"><small>${location.type}</small></p>
            ${location.description ? `<p class="mb-0"><small>${location.description}</small></p>` : ''}
            <div class="contact-info mt-2">
              <p class="mb-1"><small><i class="bi bi-telephone"></i> ${location.contact.phone}</small></p>
              <p class="mb-1"><small><i class="bi bi-envelope"></i> ${location.contact.email}</small></p>
              ${location.contact.website ? `<p class="mb-0"><small><i class="bi bi-globe"></i> <a href="${location.contact.website}" target="_blank">Sitio Web</a></small></p>` : ''}
            </div>
          </div>
        `);

        const marker = new mapboxgl.Marker()
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(this.map);

        this.markers.push(marker);
      }
    });
  }

  openLocationForm(): void {
    const modalRef = this.modalService.open(LocationFormComponent, {
      size: 'lg',
      backdrop: 'static',
    });

    modalRef.result.then(
      result => {
        if (result) {
          this.locationService.createLocation(result).subscribe();
        }
      },
      () => {}
    );
  }

  private handleError(error: any): void {
    console.error('Error in MapaEmpresasComponent:', error);
    // Here you could add more error handling logic
  }
}
