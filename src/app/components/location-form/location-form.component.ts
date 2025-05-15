import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Location, CreateLocationRequest, Coordinates, Address } from '../../models/location.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { NgbModal, NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';
import { GeocodingService, GeocodingResult } from '../../services/geocoding.service';
import { MapPickerModalComponent } from '../map-picker-modal/map-picker-modal.component';

@Component({
  selector: 'app-location-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbTypeaheadModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="row g-3">
      <!-- Información básica -->
      <div class="col-12">
        <h6 class="form-section-title">Información básica</h6>
      </div>
      
      <div class="col-md-8">
        <label for="name" class="form-label">Nombre *</label>
        <input
          type="text"
          class="form-control"
          id="name"
          formControlName="name"
          [class.is-invalid]="form.get('name')?.invalid && form.get('name')?.touched"
        />
        <div class="invalid-feedback" *ngIf="form.get('name')?.errors?.['required']">
          El nombre es requerido
        </div>
      </div>

      <div class="col-md-4">
        <label for="type" class="form-label">Tipo *</label>
        <select
          class="form-select"
          id="type"
          formControlName="type"
          [class.is-invalid]="form.get('type')?.invalid && form.get('type')?.touched"
        >
          <option value="">Seleccione un tipo</option>
          <option value="restaurant">Restaurante</option>
          <option value="hotel">Hotel</option>
          <option value="shop">Tienda</option>
          <option value="other">Otro</option>
        </select>
        <div class="invalid-feedback" *ngIf="form.get('type')?.errors?.['required']">
          El tipo es requerido
        </div>
      </div>

      <div class="col-12">
        <label for="description" class="form-label">Descripción</label>
        <textarea
          class="form-control"
          id="description"
          rows="3"
          formControlName="description"
          placeholder="Describe la ubicación..."
        ></textarea>
      </div>

      <!-- Dirección -->
      <div class="col-12">
        <h6 class="form-section-title mt-3">Dirección</h6>
        <div class="mb-3">
          <div class="btn-group w-100" role="group">
            <input type="radio" class="btn-check" name="addressMethod" id="searchMethod" [checked]="addressMethod === 'search'" (change)="setAddressMethod('search')">
            <label class="btn btn-outline-primary" for="searchMethod">
              <i class="fas fa-search me-2"></i>Buscar dirección
            </label>

            <input type="radio" class="btn-check" name="addressMethod" id="mapMethod" [checked]="addressMethod === 'map'" (change)="setAddressMethod('map')">
            <label class="btn btn-outline-primary" for="mapMethod">
              <i class="fas fa-map-marker-alt me-2"></i>Seleccionar en el mapa
            </label>
          </div>
        </div>
      </div>

      <div formGroupName="address">
        <div class="col-12" *ngIf="addressMethod === 'search'">
          <label for="addressSearch" class="form-label">Buscar dirección *</label>
          <input
            type="text"
            class="form-control"
            id="addressSearch"
            [ngbTypeahead]="searchAddresses"
            [inputFormatter]="formatAddress"
            [resultFormatter]="formatAddress"
            (selectItem)="onAddressSelected($event)"
            placeholder="Escribe para buscar direcciones..."
          />
        </div>

        <div class="col-12" *ngIf="addressMethod === 'map'">
          <button type="button" class="btn btn-outline-primary w-100" (click)="openMapPicker()">
            <i class="fas fa-map-marker-alt me-2"></i>
            {{ form.get('coordinates.coordinates')?.value?.length ? 'Cambiar ubicación en el mapa' : 'Seleccionar ubicación en el mapa' }}
          </button>
        </div>

        <!-- Campos de dirección -->
        <div class="row mt-3">
          <div class="col-12">
            <label for="street" class="form-label">Dirección *</label>
            <input
              type="text"
              class="form-control"
              id="street"
              formControlName="street"
              [class.is-invalid]="form.get('address.street')?.invalid && form.get('address.street')?.touched"
            />
            <div class="invalid-feedback" *ngIf="form.get('address.street')?.errors?.['required']">
              La dirección es requerida
            </div>
          </div>

          <div class="col-md-6 mt-3">
            <label for="city" class="form-label">Ciudad *</label>
            <input
              type="text"
              class="form-control"
              id="city"
              formControlName="city"
              [class.is-invalid]="form.get('address.city')?.invalid && form.get('address.city')?.touched"
            />
            <div class="invalid-feedback" *ngIf="form.get('address.city')?.errors?.['required']">
              La ciudad es requerida
            </div>
          </div>

          <div class="col-md-6 mt-3">
            <label for="state" class="form-label">Estado/Región *</label>
            <input
              type="text"
              class="form-control"
              id="state"
              formControlName="state"
              [class.is-invalid]="form.get('address.state')?.invalid && form.get('address.state')?.touched"
            />
            <div class="invalid-feedback" *ngIf="form.get('address.state')?.errors?.['required']">
              El estado es requerido
            </div>
          </div>
        </div>

        <div class="row mt-3">
          <div class="col-md-6">
            <label for="country" class="form-label">País *</label>
            <input
              type="text"
              class="form-control"
              id="country"
              formControlName="country"
              [class.is-invalid]="form.get('address.country')?.invalid && form.get('address.country')?.touched"
            />
            <div class="invalid-feedback" *ngIf="form.get('address.country')?.errors?.['required']">
              El país es requerido
            </div>
          </div>
          <div class="col-md-6">
            <label for="postalCode" class="form-label">Código Postal</label>
            <input
              type="text"
              class="form-control"
              id="postalCode"
              formControlName="postalCode"
            />
          </div>
        </div>
      </div>

      <!-- Coordenadas -->
      <div class="col-12">
        <h6 class="form-section-title mt-3">Coordenadas</h6>
        <div *ngIf="isLoading" class="text-center py-2">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Buscando coordenadas...</span>
          </div>
          <p class="mt-2">Buscando coordenadas...</p>
        </div>
      </div>

      <div formGroupName="coordinates">
        <input type="hidden" formControlName="type" />
        <div class="row">
          <div class="col-md-6">
            <label class="form-label">Longitud</label>
            <input
              type="number"
              class="form-control"
              [value]="form.get('coordinates.coordinates')?.value?.[0]"
              readonly
            />
          </div>
          <div class="col-md-6">
            <label class="form-label">Latitud</label>
            <input
              type="number"
              class="form-control"
              [value]="form.get('coordinates.coordinates')?.value?.[1]"
              readonly
            />
          </div>
        </div>
      </div>

      <!-- Información de contacto -->
      <div class="col-12">
        <h6 class="form-section-title mt-3">Información de contacto</h6>
      </div>

      <div formGroupName="contact">
        <div class="row">
          <div class="col-md-6">
            <label for="phone" class="form-label">Teléfono</label>
            <input
              type="tel"
              class="form-control"
              id="phone"
              formControlName="phone"
              placeholder="+56 9 1234 5678"
            />
          </div>

          <div class="col-md-6">
            <label for="email" class="form-label">Email</label>
            <input
              type="email"
              class="form-control"
              id="email"
              formControlName="email"
              [class.is-invalid]="form.get('contact.email')?.invalid && form.get('contact.email')?.touched"
              placeholder="ejemplo@dominio.com"
            />
            <div class="invalid-feedback" *ngIf="form.get('contact.email')?.errors?.['email']">
              Email inválido
            </div>
          </div>
        </div>

        <div class="col-12 mt-3">
          <label for="website" class="form-label">Sitio Web</label>
          <input
            type="url"
            class="form-control"
            id="website"
            formControlName="website"
            placeholder="https://www.ejemplo.com"
          />
        </div>
      </div>

      <!-- Botones de acción -->
      <div class="col-12 mt-4">
        <div class="d-flex justify-content-end gap-2">
          <button type="button" class="btn btn-secondary" (click)="onCancel()">
            Cancelar
          </button>
          <button type="submit" class="btn btn-primary" [disabled]="form.invalid">
            {{ location ? 'Actualizar' : 'Crear' }}
          </button>
        </div>
      </div>
    </form>
  `,
  styles: [`
    .form-section-title {
      color: #4a5568;
      font-weight: 600;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #e2e8f0;
    }
    .form-label {
      font-weight: 500;
      color: #2d3748;
    }
    .form-control, .form-select {
      border-color: #e2e8f0;
      &:focus {
        border-color: #4299e1;
        box-shadow: 0 0 0 0.2rem rgba(66, 153, 225, 0.25);
      }
    }
    .invalid-feedback {
      font-size: 0.875rem;
    }
  `]
})
export class LocationFormComponent implements OnInit, OnChanges {
  @Input() location?: Location;
  @Input() initialCoordinates?: Coordinates;
  @Input() suggestedAddress?: Address;
  @Output() locationSubmit = new EventEmitter<Location>();
  @Output() cancel = new EventEmitter<void>();

  form!: FormGroup;
  isLoading = false;
  addressMethod: 'search' | 'map' = 'search';

  constructor(
    private fb: FormBuilder,
    private geocodingService: GeocodingService,
    private modalService: NgbModal
  ) {}

  ngOnInit() {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['location'] && this.form) {
      if (this.location) {
        this.form.patchValue(this.location);
      } else {
        this.form.reset({
          coordinates: {
            type: 'Point',
            coordinates: this.initialCoordinates?.coordinates || []
          },
          address: this.suggestedAddress || {}
        });
      }
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      description: [''],
      type: ['', [Validators.required]],
      coordinates: this.fb.group({
        type: ['Point'],
        coordinates: [[], [Validators.required]]
      }),
      address: this.fb.group({
        street: ['', [Validators.required]],
        city: ['', [Validators.required]],
        state: ['', [Validators.required]],
        country: ['', [Validators.required]],
        postalCode: ['']
      }),
      contact: this.fb.group({
        phone: [''],
        email: ['', [Validators.email]],
        website: ['']
      })
    });

    if (this.location) {
      this.form.patchValue(this.location);
    }
  }

  setAddressMethod(method: 'search' | 'map'): void {
    this.addressMethod = method;
  }

  // Función para el typeahead de direcciones
  searchAddresses = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((term: string) => this.geocodingService.searchAddress(term))
    );

  // Formateador para mostrar las direcciones en el typeahead
  formatAddress = (result: GeocodingResult) => result.placeName;

  // Manejador de selección de dirección
  onAddressSelected(event: any): void {
    const result: GeocodingResult = event.item;
    
    this.form.patchValue({
      coordinates: {
        type: 'Point',
        coordinates: result.coordinates
      },
      address: result.address
    });
  }

  // Abrir el modal del mapa
  openMapPicker(): void {
    const modalRef = this.modalService.open(MapPickerModalComponent, {
      size: 'lg',
      backdrop: 'static'
    });

    // Pasar coordenadas iniciales si existen
    const currentCoordinates = this.form.get('coordinates.coordinates')?.value;
    if (currentCoordinates?.length === 2) {
      modalRef.componentInstance.initialCoordinates = currentCoordinates;
    }

    // Pasar el nombre de la ubicación
    modalRef.componentInstance.locationName = this.form.get('name')?.value;

    // Manejar la selección de ubicación
    modalRef.result.then(
      (coordinates: [number, number]) => {
        if (coordinates) {
          // Confirmar la selección
          if (confirm(`¿Estás seguro que deseas registrar esta ubicación "${this.form.get('name')?.value}"?`)) {
            this.form.patchValue({
              coordinates: {
                type: 'Point',
                coordinates: coordinates
              }
            });
          }
        }
      },
      () => {} // Dismiss
    );
  }

  onSubmit(): void {
    if (this.form.valid) {
      const formValue = this.form.value;
      this.locationSubmit.emit(formValue);
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
