import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import * as mapboxgl from 'mapbox-gl';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';

// Establecer el token de Mapbox globalmente
(mapboxgl as any).accessToken = environment.mapboxToken;

interface AddressDetails {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

@Component({
  selector: 'app-map-picker-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-header">
      <h4 class="modal-title">Seleccionar ubicación en el mapa</h4>
      <button type="button" class="btn-close" (click)="activeModal.dismiss()"></button>
    </div>
    <div class="modal-body">
      <div #mapContainer class="map-container"></div>
      <div class="selected-location mt-3" *ngIf="selectedCoordinates">
        <p class="mb-2">Ubicación seleccionada:</p>
        <p class="text-muted">
          Latitud: {{selectedCoordinates[1] | number:'1.6-6'}}<br>
          Longitud: {{selectedCoordinates[0] | number:'1.6-6'}}
        </p>
        <div *ngIf="isLoading" class="text-center mt-2">
          <div class="spinner-border spinner-border-sm text-primary" role="status">
            <span class="visually-hidden">Buscando dirección...</span>
          </div>
          <span class="ms-2">Buscando dirección...</span>
        </div>
        <div *ngIf="addressDetails && !isLoading" class="address-details mt-2">
          <p class="mb-1 fw-bold">Dirección sugerida:</p>
          <p class="mb-0 text-muted" *ngIf="addressDetails.street">Calle: {{addressDetails.street}}</p>
          <p class="mb-0 text-muted" *ngIf="addressDetails.city">Ciudad: {{addressDetails.city}}</p>
          <p class="mb-0 text-muted" *ngIf="addressDetails.state">Región: {{addressDetails.state}}</p>
          <p class="mb-0 text-muted" *ngIf="addressDetails.country">País: {{addressDetails.country}}</p>
          <p class="mb-0 text-muted" *ngIf="addressDetails.postalCode">Código Postal: {{addressDetails.postalCode}}</p>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" (click)="activeModal.dismiss()">Cancelar</button>
      <button type="button" class="btn btn-primary" (click)="confirmLocation()" [disabled]="!selectedCoordinates">
        Confirmar ubicación
      </button>
    </div>
  `,
  styles: [`
    .map-container {
      height: 400px;
      width: 100%;
      border-radius: 4px;
      overflow: hidden;
    }
    .selected-location {
      background-color: #f8f9fa;
      padding: 1rem;
      border-radius: 4px;
    }
    .address-details {
      background-color: #ffffff;
      padding: 0.75rem;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
    }
  `]
})
export class MapPickerModalComponent implements OnInit, AfterViewInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  @Input() initialCoordinates?: [number, number];
  @Input() locationName?: string;

  private map!: mapboxgl.Map;
  private marker?: mapboxgl.Marker;
  selectedCoordinates?: [number, number];
  addressDetails?: AddressDetails;
  isLoading = false;

  constructor(
    public activeModal: NgbActiveModal,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // No es necesario inicializar el token aquí ya que se hace globalmente
  }

  ngAfterViewInit(): void {
    this.initializeMap();
  }

  private initializeMap(): void {
    this.map = new mapboxgl.Map({
      container: this.mapContainer.nativeElement,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: this.initialCoordinates || [-70.6483, -33.4569], // Santiago de Chile por defecto
      zoom: 13
    });

    // Agregar controles de navegación
    this.map.addControl(new mapboxgl.NavigationControl());

    // Agregar marcador inicial si hay coordenadas
    if (this.initialCoordinates) {
      this.addMarker(this.initialCoordinates);
      this.reverseGeocode(this.initialCoordinates);
    }

    // Escuchar clicks en el mapa
    this.map.on('click', (e) => {
      const coordinates: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      this.addMarker(coordinates);
      this.selectedCoordinates = coordinates;
      this.reverseGeocode(coordinates);
    });
  }

  private addMarker(coordinates: [number, number]): void {
    // Remover marcador existente si hay uno
    if (this.marker) {
      this.marker.remove();
    }

    // Crear nuevo marcador
    this.marker = new mapboxgl.Marker({
      draggable: true,
      color: '#FF0000'
    })
      .setLngLat(coordinates)
      .addTo(this.map);

    // Actualizar coordenadas cuando se arrastra el marcador
    this.marker.on('dragend', () => {
      const lngLat = this.marker!.getLngLat();
      this.selectedCoordinates = [lngLat.lng, lngLat.lat];
      this.reverseGeocode(this.selectedCoordinates);
    });
  }

  private reverseGeocode(coordinates: [number, number]): void {
    this.isLoading = true;
    this.addressDetails = undefined;
    
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinates[0]},${coordinates[1]}.json?access_token=${environment.mapboxToken}&language=es`;
    
    this.http.get<any>(url).subscribe({
      next: (response) => {
        if (response.features && response.features.length > 0) {
          const feature = response.features[0];
          this.addressDetails = this.parseMapboxAddress(feature);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error en geocodificación inversa:', error);
        this.isLoading = false;
      }
    });
  }

  private parseMapboxAddress(feature: any): AddressDetails {
    const context = feature.context || [];
    const address: AddressDetails = {};

    // Extraer componentes de la dirección del contexto de Mapbox
    address.street = feature.address ? `${feature.address} ${feature.text}` : feature.text;
    
    context.forEach((item: any) => {
      if (item.id.startsWith('place')) {
        address.city = item.text;
      } else if (item.id.startsWith('region')) {
        address.state = item.text;
      } else if (item.id.startsWith('country')) {
        address.country = item.text;
      } else if (item.id.startsWith('postcode')) {
        address.postalCode = item.text;
      }
    });

    return address;
  }

  confirmLocation(): void {
    if (this.selectedCoordinates) {
      this.activeModal.close({
        coordinates: this.selectedCoordinates,
        addressDetails: this.addressDetails
      });
    }
  }
} 