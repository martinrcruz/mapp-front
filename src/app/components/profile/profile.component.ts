import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  form!: FormGroup;
  successMessage = '';
  passwordChangeSuccess = false;
  passwordChangeError = '';

  constructor(
    private fb: FormBuilder,
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = this.authService.user;
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.form = this.fb.group(
      {
        name: [user.name, [Validators.required]],
        email: [{ value: user.email, disabled: true }],
        currentPassword: ['', [Validators.required]],
        newPassword: ['', [Validators.minLength(6)]],
        confirmPassword: [''],
      },
      {
        validators: this.passwordMatchValidator,
      }
    );
  }

  private passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');

    if (newPassword?.value && newPassword.value !== confirmPassword?.value) {
      confirmPassword?.setErrors({ passwordMismatch: true });
    } else {
      confirmPassword?.setErrors(null);
    }

    return null;
  }

  onSubmit(): void {
    if (this.form.valid) {
      const { currentPassword, newPassword, _confirmPassword } = this.form.value;
      this.authService.updateProfile(this.form.value).subscribe({
        next: () => {
          this.successMessage = 'Perfil actualizado correctamente';
          this.form.patchValue({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
        },
      });
    }
  }

  onChangePassword(): void {
    if (this.form.valid) {
      const { currentPassword, newPassword } = this.form.value;
      this.authService.changePassword(currentPassword, newPassword).subscribe({
        next: () => {
          this.passwordChangeSuccess = true;
          this.form.reset();
        },
        error: (error: Error) => {
          this.passwordChangeError = 'Error al cambiar la contraseña';
          console.error('Error al cambiar contraseña:', error.message);
        }
      });
    }
  }
}
