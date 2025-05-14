import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Location, LocationResponse, CreateLocationRequest, UpdateLocationRequest } from '../models/location.model';

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private readonly API_URL = `${environment.apiUrl}/locations`;

  // Signals
  private locationsSignal = signal<Location[]>([]);
  private selectedLocationSignal = signal<Location | null>(null);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  // Exponer signals como readonly
  readonly locations = this.locationsSignal.asReadonly();
  readonly selectedLocation = this.selectedLocationSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  constructor(private http: HttpClient) {
    this.loadLocations();
  }

  loadLocations(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.http.get<LocationResponse>(this.API_URL).subscribe({
      next: response => {
        if (response.success) {
          this.locationsSignal.set(response.data);
        } else {
          this.errorSignal.set('Error al cargar ubicaciones');
        }
        this.loadingSignal.set(false);
      },
      error: error => {
        this.errorSignal.set(error.error?.message || 'Error al cargar ubicaciones');
        this.loadingSignal.set(false);
      },
    });
  }

  getLocation(id: string): Observable<Location> {
    return this.http
      .get<Location>(`${this.API_URL}/${id}`)
      .pipe(tap(location => this.selectedLocationSignal.set(location)));
  }

  createLocation(request: CreateLocationRequest): Observable<Location> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.post<Location>(`${this.API_URL}`, request).pipe(
      tap({
        next: newLocation => {
          this.locationsSignal.update(locations => [...locations, newLocation]);
          this.loadingSignal.set(false);
        },
        error: error => {
          this.errorSignal.set(error.error?.message || 'Error al crear ubicación');
          this.loadingSignal.set(false);
        },
      })
    );
  }

  updateLocation(id: string, request: UpdateLocationRequest): Observable<Location> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.put<Location>(`${this.API_URL}/${id}`, request).pipe(
      tap({
        next: updatedLocation => {
          this.locationsSignal.update(locations =>
            locations.map(loc => (loc._id === id ? updatedLocation : loc))
          );
          if (this.selectedLocationSignal()?._id === id) {
            this.selectedLocationSignal.set(updatedLocation);
          }
          this.loadingSignal.set(false);
        },
        error: error => {
          this.errorSignal.set(error.error?.message || 'Error al actualizar ubicación');
          this.loadingSignal.set(false);
        },
      })
    );
  }

  deleteLocation(id: string): Observable<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.delete<void>(`${this.API_URL}/${id}`).pipe(
      tap({
        next: () => {
          this.locationsSignal.update(locations => locations.filter(loc => loc._id !== id));
          if (this.selectedLocationSignal()?._id === id) {
            this.selectedLocationSignal.set(null);
          }
          this.loadingSignal.set(false);
        },
        error: error => {
          this.errorSignal.set(error.error?.message || 'Error al eliminar ubicación');
          this.loadingSignal.set(false);
        },
      })
    );
  }

  clearError(): void {
    this.errorSignal.set(null);
  }

  clearSelectedLocation(): void {
    this.selectedLocationSignal.set(null);
  }

  getLocations(): Observable<LocationResponse> {
    return this.http.get<LocationResponse>(this.API_URL);
  }

  searchLocations(query: string): Observable<Location[]> {
    return this.http.get<Location[]>(`${this.API_URL}/search?q=${encodeURIComponent(query)}`);
  }

  getLocationById(id: string): Observable<Location> {
    return this.http.get<Location>(`${this.API_URL}/${id}`);
  }

  createLocationRequest(location: CreateLocationRequest): Observable<Location> {
    return this.http.post<Location>(this.API_URL, location);
  }

  updateLocationRequest(id: string, location: UpdateLocationRequest): Observable<Location> {
    return this.http.patch<Location>(`${this.API_URL}/${id}`, location);
  }

  deleteLocationRequest(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
