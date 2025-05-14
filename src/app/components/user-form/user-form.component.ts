import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="userForm" (ngSubmit)="onSubmit()">
      <div class="mb-3">
        <label for="name" class="form-label">Nombre</label>
        <input type="text" class="form-control" id="name" formControlName="name">
      </div>
      <div class="mb-3">
        <label for="email" class="form-label">Email</label>
        <input type="email" class="form-control" id="email" formControlName="email">
      </div>
      <div class="mb-3">
        <label for="password" class="form-label">Contraseña</label>
        <input type="password" class="form-control" id="password" formControlName="password">
        <small class="text-muted" *ngIf="user">Dejar en blanco para mantener la contraseña actual</small>
      </div>
      <div class="mb-3">
        <label for="role" class="form-label">Rol</label>
        <select class="form-select" id="role" formControlName="role">
          <option value="user">Usuario</option>
          <option value="admin">Administrador</option>
          <option value="editor">Editor</option>
        </select>
      </div>
      <div class="d-flex justify-content-end gap-2">
        <button type="button" class="btn btn-secondary" (click)="onCancel()">Cancelar</button>
        <button type="submit" class="btn btn-primary" [disabled]="userForm.invalid">Guardar</button>
      </div>
    </form>
  `
})
export class UserFormComponent {
  @Input() user?: User;
  @Output() userSubmit = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  userForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', this.user ? [] : Validators.required],
      role: ['user', Validators.required]
    });
  }

  ngOnInit() {
    if (this.user) {
      this.userForm.patchValue({
        name: this.user.name,
        email: this.user.email,
        role: this.user.role
      });
    }
  }

  onSubmit() {
    if (this.userForm.valid) {
      const formData = this.userForm.value;
      if (this.user && !formData.password) {
        delete formData.password;
      }
      this.userSubmit.emit(formData);
    }
  }

  onCancel() {
    this.cancel.emit();
  }
} 