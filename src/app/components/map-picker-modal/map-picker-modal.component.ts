import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import * as mapboxgl from 'mapbox-gl';
import { environment } from '../../../environments/environment';

// Establecer el token de Mapbox globalmente
(mapboxgl as any).accessToken = environment.mapboxToken;

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
  `]
})
export class MapPickerModalComponent implements OnInit, AfterViewInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  @Input() initialCoordinates?: [number, number];
  @Input() locationName?: string;

  private map!: mapboxgl.Map;
  private marker?: mapboxgl.Marker;
  selectedCoordinates?: [number, number];

  constructor(public activeModal: NgbActiveModal) {}

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
    }

    // Escuchar clicks en el mapa
    this.map.on('click', (e) => {
      const coordinates: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      this.addMarker(coordinates);
      this.selectedCoordinates = coordinates;
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
    });
  }

  confirmLocation(): void {
    if (this.selectedCoordinates) {
      this.activeModal.close(this.selectedCoordinates);
    }
  }
} 