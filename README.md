# Mapp Frontend

Aplicación web para visualizar y gestionar ubicaciones en un mapa interactivo.

## Requisitos

- Node.js 18.x o superior
- npm 9.x o superior

## Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/tu-usuario/mapp.git
cd mapp/frontend
```

2. Instalar dependencias:
```bash
npm install
```

3. Crear archivo de entorno:
```bash
cp src/environments/environment.example.ts src/environments/environment.ts
```

4. Configurar variables de entorno en `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  mapboxToken: 'tu-token-de-mapbox'
};
```

## Desarrollo

1. Iniciar servidor de desarrollo:
```bash
npm start
```

2. Abrir navegador en `http://localhost:4200`

## Construcción

1. Construir para producción:
```bash
npm run build
```

2. Los archivos generados se encontrarán en `dist/mapp-frontend`

## Pruebas

1. Ejecutar pruebas unitarias:
```bash
npm test
```

2. Ejecutar pruebas con cobertura:
```bash
npm run test -- --code-coverage
```

## Linting y Formateo

1. Ejecutar linter:
```bash
npm run lint
```

2. Corregir errores de linting:
```bash
npm run lint:fix
```

3. Formatear código:
```bash
npm run format
```

## Estructura del Proyecto

```
src/
├── app/
│   ├── components/     # Componentes de la aplicación
│   ├── guards/         # Guardias de ruta
│   ├── interceptors/   # Interceptores HTTP
│   ├── models/         # Modelos de datos
│   ├── services/       # Servicios
│   ├── app.component.ts
│   ├── app.config.ts
│   └── app.routes.ts
├── assets/            # Recursos estáticos
├── environments/      # Configuraciones de entorno
└── styles.scss       # Estilos globales
```

## Tecnologías Utilizadas

- Angular 16
- Bootstrap 5
- Mapbox GL JS
- RxJS
- TypeScript
- ESLint
- Prettier

## Licencia

MIT
