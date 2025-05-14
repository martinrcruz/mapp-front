import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-md-6 col-lg-4">
          <div class="card shadow-sm mt-5">
            <div class="card-body p-4">
              <h2 class="text-center mb-4">Registro</h2>

              <form [formGroup]="form" (ngSubmit)="onSubmit()">
                <div class="mb-3">
                  <label for="name" class="form-label">Nombre</label>
                  <input
                    type="text"
                    class="form-control"
                    id="name"
                    formControlName="name"
                    [class.is-invalid]="form.get('name')?.invalid && form.get('name')?.touched"
                    autocomplete="name"
                  />
                  <div class="invalid-feedback" *ngIf="form.get('name')?.errors?.['required']">
                    El nombre es requerido
                  </div>
                </div>

                <div class="mb-3">
                  <label for="email" class="form-label">Correo electrónico</label>
                  <input
                    type="email"
                    class="form-control"
                    id="email"
                    formControlName="email"
                    [class.is-invalid]="form.get('email')?.invalid && form.get('email')?.touched"
                    autocomplete="email"
                  />
                  <div class="invalid-feedback" *ngIf="form.get('email')?.errors?.['required']">
                    El correo electrónico es requerido
                  </div>
                  <div class="invalid-feedback" *ngIf="form.get('email')?.errors?.['email']">
                    Ingrese un correo electrónico válido
                  </div>
                </div>

                <div class="mb-3">
                  <label for="password" class="form-label">Contraseña</label>
                  <input
                    type="password"
                    class="form-control"
                    id="password"
                    formControlName="password"
                    [class.is-invalid]="
                      form.get('password')?.invalid && form.get('password')?.touched
                    "
                    autocomplete="new-password"
                  />
                  <div class="invalid-feedback" *ngIf="form.get('password')?.errors?.['required']">
                    La contraseña es requerida
                  </div>
                  <div class="invalid-feedback" *ngIf="form.get('password')?.errors?.['minlength']">
                    La contraseña debe tener al menos 6 caracteres
                  </div>
                </div>

                <div class="mb-3">
                  <label for="confirmPassword" class="form-label">Confirmar contraseña</label>
                  <input
                    type="password"
                    class="form-control"
                    id="confirmPassword"
                    formControlName="confirmPassword"
                    [class.is-invalid]="
                      form.get('confirmPassword')?.invalid && form.get('confirmPassword')?.touched
                    "
                    autocomplete="new-password"
                  />
                  <div
                    class="invalid-feedback"
                    *ngIf="form.get('confirmPassword')?.errors?.['required']"
                  >
                    Confirme su contraseña
                  </div>
                  <div
                    class="invalid-feedback"
                    *ngIf="form.get('confirmPassword')?.errors?.['passwordMismatch']"
                  >
                    Las contraseñas no coinciden
                  </div>
                </div>

                <div class="d-grid gap-2">
                  <button
                    type="submit"
                    class="btn btn-primary"
                    [disabled]="form.invalid || authService.loading"
                  >
                    <span
                      class="spinner-border spinner-border-sm me-2"
                      *ngIf="authService.loading"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Registrarse
                  </button>
                </div>

                <div class="alert alert-danger mt-3" *ngIf="authService.error">
                  {{ authService.error }}
                </div>

                <div class="text-center mt-3">
                  <p class="mb-0">
                    ¿Ya tienes una cuenta?
                    <a routerLink="/login">Inicia sesión</a>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class RegisterComponent implements OnInit {
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group(
      {
        name: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      {
        validators: this.passwordMatchValidator,
      }
    );

    // Si el usuario ya está autenticado, redirigir al mapa
    if (this.authService.user) {
      this.router.navigate(['/']);
    }
  }

  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password?.value !== confirmPassword?.value) {
      confirmPassword?.setErrors({ passwordMismatch: true });
    } else {
      confirmPassword?.setErrors(null);
    }

    return null;
  }

  onSubmit(): void {
    if (this.form.valid) {
      const { confirmPassword, ...registerData } = this.form.value;
      this.authService.register(registerData).subscribe({
        next: () => {
          this.router.navigate(['/']);
        },
      });
    }
  }
}
