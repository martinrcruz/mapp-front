import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';
import { UserFormComponent } from '../user-form/user-form.component';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-user-manager',
  templateUrl: './user-manager.component.html',
  styleUrls: ['./user-manager.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    UserFormComponent,
    NgbPaginationModule
  ]
})
export class UserManagerComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  selectedUser: User | undefined = undefined;
  showModal = false;

  // Paginación
  page = 1;
  pageSize = 10;
  total = 0;

  // Búsqueda
  searchControl = new FormControl('');

  // Para usar Math en el template
  protected Math = Math;

  constructor(
    private userService: UserService,
    private alertService: AlertService
  ) {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      this.filterUsers(value || '');
    });
  }

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.userService.getUsers().subscribe({
      next: (response) => {
        this.users = response;
        this.filterUsers(this.searchControl.value || '');
      },
      error: (error) => {
        this.alertService.error('Error', 'No se pudieron cargar los usuarios');
        console.error('Error al cargar usuarios:', error);
      }
    });
  }

  filterUsers(searchTerm: string) {
    if (!searchTerm) {
      this.filteredUsers = [...this.users];
    } else {
      const term = searchTerm.toLowerCase();
      this.filteredUsers = this.users.filter(user => 
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.role.toLowerCase().includes(term)
      );
    }
    this.total = this.filteredUsers.length;
    this.page = 1;
  }

  get paginatedUsers() {
    const startIndex = (this.page - 1) * this.pageSize;
    return this.filteredUsers.slice(startIndex, startIndex + this.pageSize);
  }

  onPageChange(page: number) {
    this.page = page;
  }

  openAddModal() {
    this.selectedUser = undefined;
    this.showModal = true;
  }

  openEditModal(user: User) {
    this.selectedUser = user;
    console.log(user)
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    // this.selectedUser = undefined;
  }

  toggleUserStatus(user: User) {
    user.isActive = !user.isActive;
    this.userService.updateUser(user._id, user).subscribe({
      next: () => {
        this.loadUsers();
        this.alertService.success('Éxito', 'Estado del usuario actualizado correctamente');
      },
      error: (error) => {
        console.error('Error al actualizar el estado:', error);
        user.isActive = !user.isActive; // Revertir cambio en caso de error
        this.alertService.error('Error', 'No se pudo actualizar el estado del usuario');
      }
    });
  }

  deleteUser(userId: string) {
    this.alertService.confirm('Confirmación', '¿Estás seguro de que deseas eliminar este usuario?')
      .then((result) => {
        if (result.isConfirmed) {
          this.userService.deleteUser(userId).subscribe({
            next: () => {
              this.loadUsers();
              this.alertService.success('Éxito', 'Usuario eliminado correctamente');
            },
            error: (error) => {
              console.error('Error al eliminar el usuario:', error);
              this.alertService.error('Error', 'No se pudo eliminar el usuario');
            }
          });
        }
      });
  }

  saveUser(userData: any) {
    const request = this.selectedUser
      ? this.userService.updateUser(this.selectedUser._id, userData)
      : this.userService.createUser(userData);

    request.subscribe({
      next: () => {
        this.closeModal();
        this.loadUsers();
        console.log(this.selectedUser)
        const action = this.selectedUser ? 'actualizado' : 'creado';
        this.alertService.success('Éxito', `Usuario ${action} correctamente`);
      },
      error: (error) => {
        console.error('Error al guardar el usuario:', error);
        this.alertService.error('Error', 'No se pudo guardar el usuario');
      }
    });
  }
} 