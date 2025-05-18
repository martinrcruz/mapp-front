import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Map, Marker, Popup } from 'mapbox-gl';
import { LocationService } from '../../services/location.service';
import { Location, LocationResponse, Coordinates, Address } from '../../models/location.model';
import { environment } from '../../../environments/environment';
import { SearchBarComponent } from '../search-bar/search-bar.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { LocationFormComponent } from '../location-form/location-form.component';
import { HttpClient } from '@angular/common/http';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-public-map',
  templateUrl: './public-map.component.html',
  styleUrls: ['./public-map.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    SearchBarComponent, 
    FormsModule, 
    ReactiveFormsModule, 
    LocationFormComponent,
    NgbModule
  ]
})
export class PublicMapComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('map') mapElement!: ElementRef;
  @ViewChild('locationModal') locationModal: any;
  
  map!: Map;
  markers: { [key: string]: Marker } = {};
  currentPopup?: Popup;
  searchResults: Location[] = [];
  locations: Location[] = [];
  selectedLocation: Location | null = null;
  editMode = false;
  showNewLocationModal = false;
  newLocationCoordinates?: Coordinates;
  suggestedAddress?: Address;
  isLoading = false;

  constructor(
    private locationService: LocationService,
    public authService: AuthService,
    private http: HttpClient,
    private modalService: NgbModal
  ) {}

  ngOnInit() {
    this.loadLocations();
    this.setupEventListeners();
  }

  ngAfterViewInit() {
    this.initializeMap();
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
    document.removeEventListener('showLocationDetails', (() => {}) as EventListener);
  }

  private initializeMap() {
    this.map = new Map({
      container: this.mapElement.nativeElement,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: environment.defaultMapCenter as [number, number],
      zoom: environment.defaultMapZoom,
      accessToken: environment.mapboxToken
    });

    this.map.on('click', (e) => {
      if (this.currentPopup) {
        this.currentPopup.remove();
      }

      if (this.editMode && this.authService.isAuthenticated()) {
        this.newLocationCoordinates = {
          type: 'Point',
          coordinates: [e.lngLat.lng, e.lngLat.lat]
        };
        this.getReverseGeocoding(e.lngLat.lng, e.lngLat.lat);
        this.showNewLocationModal = true;
      }
    });
  }

  private loadLocations() {
    this.locationService.getLocations().subscribe(response => {
      this.locations = response.data;
      this.addMarkersToMap();
    });
  }

  private addMarkersToMap() {
    if (!this.map) return;

    this.locations.forEach(location => {
      if (!location.coordinates?.coordinates) return;

      const [longitude, latitude] = location.coordinates.coordinates;

      const marker = new Marker()
        .setLngLat([longitude, latitude])
        .addTo(this.map);

      marker.getElement().addEventListener('click', () => {
        this.selectedLocation = location;
      });

      this.markers[location._id] = marker;
    });
  }

  onSearch(query: string) {
    if (query === '') {
      this.searchResults = [];
      return;
    }
    this.locationService.searchLocations(query).subscribe({
      next: (results) => {
        this.searchResults = results;
      },
      error: (error) => {
        console.error('Error en la búsqueda:', error);
        this.searchResults = [];
      }
    });
  }

  onLocationSelect(location: Location) {
    if (!this.map || !location || !location.coordinates?.coordinates) return;

    const marker = this.markers[location._id];
    if (marker) {
      this.map.flyTo({
        center: location.coordinates.coordinates,
        zoom: 15
      });
      this.selectedLocation = location;
    }
  }

  closeLocationInfo() {
    this.selectedLocation = null;
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
  }

  closeNewLocationModal(): void {
    this.modalService.dismissAll();
    this.newLocationCoordinates = undefined;
    this.suggestedAddress = undefined;
  }

  editLocation(location: Location) {
    if (!this.authService.isAuthenticated()) return;
    
    this.selectedLocation = location;
    this.newLocationCoordinates = location.coordinates;
    this.suggestedAddress = location.address;
    this.modalService.open(this.locationModal, { 
      size: 'lg',
      centered: true 
    });
  }

  deleteLocation(location: Location) {
    if (!this.authService.isAuthenticated()) return;

    if (confirm('¿Estás seguro de que deseas eliminar esta ubicación?')) {
      this.locationService.deleteLocation(location._id).subscribe({
        next: () => {
          this.closeLocationInfo();
          this.loadLocations();
        },
        error: (error) => {
          console.error('Error al eliminar la ubicación:', error);
          alert('No se pudo eliminar la ubicación. Por favor, inténtalo de nuevo.');
        }
      });
    }
  }

  onNewLocationSubmit(locationData: any) {
    const isEditing = !!this.selectedLocation;
    const request = isEditing 
      ? this.locationService.updateLocation(this.selectedLocation?._id!, locationData)
      : this.locationService.createLocation(locationData);

    request.subscribe({
      next: () => {
        this.modalService.dismissAll();
        this.loadLocations();
        if (isEditing) {
          this.closeLocationInfo();
        }
      },
      error: (error) => {
        console.error('Error al guardar la ubicación:', error);
        alert('No se pudo guardar la ubicación. Por favor, inténtalo de nuevo.');
      }
    });
  }

  private getReverseGeocoding(lng: number, lat: number): void {
    this.isLoading = true;
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${environment.mapboxToken}`;
    
    this.http.get<any>(url).subscribe({
      next: (response) => {
        if (response.features && response.features.length > 0) {
          const addressFeature = response.features[0];
          const cityFeature = response.features.find((f: any) => f.place_type[0] === 'place');
          const stateFeature = response.features.find((f: any) => f.place_type[0] === 'region');
          const countryFeature = response.features.find((f: any) => f.place_type[0] === 'country');
          const postalFeature = response.features.find((f: any) => f.place_type[0] === 'postcode');

          this.suggestedAddress = {
            street: addressFeature.place_name.split(',')[0],
            city: cityFeature?.text || '',
            state: stateFeature?.text || '',
            country: countryFeature?.text || '',
            postalCode: postalFeature?.text || ''
          };

          this.newLocationCoordinates = {
            type: 'Point',
            coordinates: [lng, lat]
          };

          if (this.locationModal) {
            this.modalService.open(this.locationModal, { 
              size: 'lg',
              backdrop: 'static'
            });
          }
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error en geocoding inverso:', error);
        this.isLoading = false;
      }
    });
  }

  private setupEventListeners(): void {
    document.addEventListener('showLocationDetails', ((event: CustomEvent) => {
      const locationId = event.detail;
      const location = this.locations.find(loc => loc._id === locationId);
      if (location) {
        this.selectedLocation = location;
      }
    }) as EventListener);
  }
} 