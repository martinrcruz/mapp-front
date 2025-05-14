import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Location, CreateLocationRequest, Coordinates, Address } from '../../models/location.model';

@Component({
  selector: 'app-location-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
      </div>

      <div formGroupName="address">
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

        <div class="row mt-3">
          <div class="col-md-6">
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
          <div class="col-md-6">
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

      <!-- Coordenadas -->
      <div class="col-12">
        <h6 class="form-section-title mt-3">Ubicación en el mapa</h6>
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

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
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
        coordinates: [this.location?.coordinates?.coordinates || this.initialCoordinates?.coordinates || [], [Validators.required]]
      }),
      address: this.fb.group({
        street: [this.location?.address?.street || this.suggestedAddress?.street || '', [Validators.required]],
        city: [this.location?.address?.city || this.suggestedAddress?.city || '', [Validators.required]],
        state: [this.location?.address?.state || this.suggestedAddress?.state || '', [Validators.required]],
        country: [this.location?.address?.country || this.suggestedAddress?.country || '', [Validators.required]],
        postalCode: [this.location?.address?.postalCode || this.suggestedAddress?.postalCode || '']
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
