import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface GeocodingResult {
  placeName: string;
  coordinates: [number, number];
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class GeocodingService {
  private readonly MAPBOX_API = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

  constructor(private http: HttpClient) {}

  searchAddress(query: string): Observable<GeocodingResult[]> {
    if (!query.trim()) {
      return of([]);
    }

    const url = `${this.MAPBOX_API}/${encodeURIComponent(query)}.json?access_token=${environment.mapboxToken}&types=address&language=es`;

    return this.http.get<any>(url).pipe(
      map(response => {
        return response.features.map((feature: any) => ({
          placeName: feature.place_name,
          coordinates: feature.center,
          address: this.parseMapboxAddress(feature)
        }));
      }),
      catchError(error => {
        console.error('Error en geocodificación:', error);
        return of([]);
      })
    );
  }

  private parseMapboxAddress(feature: any): any {
    const context = feature.context || [];
    const address: any = {};

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
} 