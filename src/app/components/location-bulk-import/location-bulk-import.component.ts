import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import * as XLSX from 'xlsx';
import { LocationService } from '../../services/location.service';
import { GeocodingService } from '../../services/geocoding.service';
import { Location, CreateLocationRequest } from '../../models/location.model';
import { AlertService } from '../../services/alert.service';
import { NgbProgressbarModule } from '@ng-bootstrap/ng-bootstrap';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-location-bulk-import',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    NgbProgressbarModule,
    RouterModule
  ],
  templateUrl: './location-bulk-import.component.html',
  styleUrls: ['./location-bulk-import.component.scss']
})
export class LocationBulkImportComponent implements OnInit {
  file: File | null = null;
  fileName: string = '';
  isLoading: boolean = false;
  isProcessing: boolean = false;

  // Para la previsualización de datos
  previewData: any[] = [];
  hasPreview: boolean = false;

  // Progreso de importación
  totalLocations: number = 0;
  processedLocations: number = 0;
  successfulImports: number = 0;
  failedImports: number = 0;
  progress: number = 0;

  // Estado actual del proceso
  currentStatus: string = '';

  // Errores
  errors: { row: number, message: string }[] = [];

  // Plantilla de ejemplo para descargar
  exampleTemplate: any[] = [
    {
      nombre_empresa: 'Empresa Ejemplo',
      nombre_comercial: 'Comercial Ejemplo',
      descripcion: 'Una descripción de ejemplo',
      actividad: 'Comercio minorista',
      direccion: 'Av. Ejemplo 123',
      ciudad: 'Ciudad Ejemplo',
      estado: 'Estado Ejemplo',
      pais: 'País Ejemplo',
      codigo_postal: '12345',
      municipio: 'Municipio Ejemplo',
      cif: 'B12345678',
      cnae: '4719',
      telefono: '+56912345678',
      email: 'contacto@ejemplo.com',
      sitio_web: 'https://www.ejemplo.com'
      // No incluir coordenadas, se obtendrán automáticamente de la dirección
    }
  ];

  constructor(
    private locationService: LocationService,
    private geocodingService: GeocodingService,
    private alertService: AlertService
  ) { }

  ngOnInit(): void { }

  onFileChange(event: any): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length) {
      this.file = target.files[0];
      this.fileName = this.file.name;
      this.readFile();
    }
  }

  readFile(): void {
    if (!this.file) return;

    this.isLoading = true;
    this.hasPreview = false;
    this.previewData = [];

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });

      // Leer la primera hoja
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // Convertir a JSON
      this.previewData = XLSX.utils.sheet_to_json(worksheet, { raw: false });

      // Mostrar solo los primeros 10 registros para previsualización
      this.previewData = this.previewData.slice(0, 10);
      this.hasPreview = true;
      this.isLoading = false;
      this.totalLocations = XLSX.utils.sheet_to_json(worksheet, { raw: false }).length;
    };

    reader.onerror = (error) => {
      this.isLoading = false;
      this.alertService.error('Error', 'No se pudo leer el archivo');
      console.error('Error al leer el archivo:', error);
    };

    reader.readAsArrayBuffer(this.file);
  }

  startImport(): void {
    if (!this.file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });

      // Leer la primera hoja
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // Convertir a JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });

      this.processImport(jsonData);
    };

    reader.readAsArrayBuffer(this.file);
  }

  processImport(data: any[]): void {
    this.isProcessing = true;
    this.errors = [];
    this.processedLocations = 0;
    this.successfulImports = 0;
    this.failedImports = 0;
    this.totalLocations = data.length;
    this.progress = 0;

    // Procesar las locaciones secuencialmente para evitar sobrecargar la API
    this.processNextLocation(data, 0);
  }

  processNextLocation(data: any[], index: number): void {
    if (index >= data.length) {
      // Proceso completado
      this.isProcessing = false;
      this.currentStatus = 'Importación finalizada';

      if (this.failedImports === 0) {
        this.alertService.success('Éxito', `Se importaron ${this.successfulImports} locaciones correctamente`);
      } else {
        this.alertService.warning('Advertencia', `Se importaron ${this.successfulImports} locaciones, pero ${this.failedImports} fallaron. Revise los errores para más detalles.`);
      }
      return;
    }

    const row = data[index];
    this.currentStatus = `Procesando: ${row.nombre_empresa || 'Locación ' + (index + 1)}`;

    // Construir la dirección completa para la búsqueda de geocodificación
    const addressQuery = `${row.direccion || ''}, ${row.ciudad || ''}`.trim();

    if (!addressQuery) {
      this.addError(index, 'La dirección está incompleta');
      this.updateProgress(index, data.length);
      this.processNextLocation(data, index + 1);
      return;
    }

    this.geocodingService.searchAddress(addressQuery)
      .pipe(finalize(() => {
        this.updateProgress(index, data.length);
        this.processNextLocation(data, index + 1);
      }))
      .subscribe({
        next: (results) => {
          if (results.length === 0) {
            this.addError(index, 'No se encontraron coordenadas para la dirección proporcionada. Verifique que la dirección sea correcta y completa.');
            this.failedImports++;
            return;
          }

          // Usar el primer resultado
          const geocodingResult = results[0];

          // Crear el objeto de locación
          const locationData: CreateLocationRequest = {
            companyName: row.nombre_empresa || row.nombre || '',
            comercialName: row.nombre_comercial || row.nombre || '',
            description: row.descripcion || '',
            activity: row.actividad || row.tipo || '',
            coordinates: {
              type: 'Point',
              coordinates: geocodingResult.coordinates
            },
            address: {
              street: row.direccion || geocodingResult.address?.street || '',
              city: row.ciudad || geocodingResult.address?.city || '',
              state: row.estado || geocodingResult.address?.state || '',
              country: row.pais || geocodingResult.address?.country || '',
              postalCode: row.codigo_postal || geocodingResult.address?.postalCode || ''
            },
            municipality: row.municipio || '',
            cif: row.cif || '',
            cnae: row.cnae || '',
            contact: {
              phone: row.telefono || '',
              email: row.email || '',
              website: row.sitio_web || ''
            }
          };

          // Validar datos mínimos requeridos
          if (!this.validateLocationData(locationData)) {
            this.addError(index, 'Faltan campos obligatorios');
            this.failedImports++;
            return;
          }

          // Guardar la locación
          this.locationService.createLocation(locationData).subscribe({
            next: () => {
              this.successfulImports++;
            },
            error: (error) => {
              this.failedImports++;
              this.addError(index, `Error al guardar: ${error.error?.message || 'Error desconocido'}`);
            }
          });
        },
        error: (error) => {
          this.failedImports++;
          this.addError(index, `Error de geocodificación: ${error.message || 'Error desconocido'}`);
        }
      });
  }

  validateLocationData(location: CreateLocationRequest): boolean {
    console.log(location.companyName)
    console.log(location.comercialName)
    console.log(location.activity)
    console.log(location.coordinates.coordinates.length)
    console.log(location.address.street)
    console.log(location.address.city)
    console.log(location.address.country)
    return !!(
      location.companyName &&
      location.comercialName &&
      location.activity &&
      location.coordinates.coordinates.length == 2 &&
      location.address.street &&
      location.address.city &&
      location.address.country
    );
  }

  updateProgress(currentIndex: number, totalItems: number): void {
    this.processedLocations = currentIndex + 1;
    this.progress = Math.round((this.processedLocations / totalItems) * 100);
  }

  addError(row: number, message: string): void {
    this.errors.push({ row: row + 1, message });
  }

  generateExampleTemplate(): void {
    const worksheet = XLSX.utils.json_to_sheet(this.exampleTemplate);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla');

    // Generar archivo para descargar
    XLSX.writeFile(workbook, 'plantilla_importacion_locaciones.xlsx');
  }

  resetForm(): void {
    this.file = null;
    this.fileName = '';
    this.previewData = [];
    this.hasPreview = false;
    this.isProcessing = false;
    this.errors = [];
    this.totalLocations = 0;
    this.processedLocations = 0;
    this.successfulImports = 0;
    this.failedImports = 0;
    this.progress = 0;
    this.currentStatus = '';
  }
} 