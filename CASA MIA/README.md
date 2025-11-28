# 🏪 CASA MIA - Sistema de Gestión de Restaurante

Sistema de gestión completo para restaurantes con autenticación por roles, gestión de órdenes, pagos y reportes en tiempo real.

---

## 📋 Tabla de Contenidos

1. [Inicio Rápido](#-inicio-rápido)
2. [Documentación](#-documentación)
3. [Estructura del Proyecto](#-estructura-del-proyecto)
4. [Roles y Responsabilidades](#-roles-y-responsabilidades)
5. [Modelo de Datos](#-modelo-de-datos)
6. [Configuración Firebase](#-configuración-firebase)
7. [Tech Stack](#-tech-stack)

---

## 🚀 Inicio Rápido

### Requisitos
- Node.js 18+
- npm 9+
- Cuenta Firebase (configurada)

### Pasos

1. **Instalar dependencias:**
```bash
npm install
```

2. **Iniciar servidor de desarrollo:**
```bash
npm run dev
```

La app se abrirá en `http://localhost:5179` (o el puerto disponible siguiente)

3. **Registrarse y asignar rol:**
   - Visita la app
   - Haz clic en "Registrarse"
   - Ingresa email y contraseña
   - Ve a Firebase Console → Realtime Database
   - Edita `/usuarios/{uid}` y establece `rol` a uno de:
     - `"Admin"`
     - `"Mesero"`
     - `"Cosinero"`
     - `"Cajero"`
   - Refrescar la app (debería redirigirse al dashboard del rol)

4. **Build para producción:**
```bash
npm run build
```

---

## 📚 Documentación

Todos los documentos se encuentran en la carpeta `docs/`:

### 📖 Para Empezar
- **[QUICK_START.md](./docs/QUICK_START.md)** - Guía de 15 minutos para iniciarse
- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - Diagrama completo del sistema y flujos

### 🎯 Por Rol (Lee la que corresponda a tu equipo)
- **[ADMIN_INTEGRATION.md](./docs/ADMIN_INTEGRATION.md)** - Gestión de usuarios, menú, mesas, reportes
- **[MESERO_INTEGRATION.md](./docs/MESERO_INTEGRATION.md)** - Creación de órdenes, gestión de mesas
- **[COCINERO_INTEGRATION.md](./docs/COCINERO_INTEGRATION.md)** - Preparación de órdenes, estados
- **[CAJERO_INTEGRATION.md](./docs/CAJERO_INTEGRATION.md)** - Procesamiento de pagos, recibos, reportes

---

## 📁 Estructura del Proyecto

```
CASA MIA/
├── src/
│   ├── main.jsx                ← Entry point React
│   ├── App.jsx                 ← Router principal
│   ├── config/                 ← Configuración
│   │   ├── firebaseConfig.js   ← Credenciales Firebase
│   │   ├── firebase.init.js    ← Inicialización de servicios
│   │   └── database.rules.json ← Reglas de seguridad
│   ├── shared/                 ← Código compartido
│   │   ├── components/         ← Componentes compartidos
│   │   │   ├── LoginRegister.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── ProtectedAdminRoute.jsx
│   │   │   └── Chatbot.jsx
│   │   ├── hooks/              ← Hooks compartidos
│   │   │   └── useAuth.jsx
│   │   └── styles/             ← Estilos compartidos
│   │       ├── theme.css
│   │       ├── LoginRegister.css
│   │       └── Chatbot.css
│   └── features/               ← Módulos por rol
│       ├── admin/
│       │   ├── components/
│       │   ├── panels/
│       │   ├── AdminDashboard.jsx
│       │   └── AdminDashboard.css
│       ├── mesero/
│       │   ├── components/
│       │   ├── utils/
│       │   ├── MeseroDashboard.jsx
│       │   └── MeseroDashboard.css
│       ├── cocinero/
│       │   ├── components/
│       │   ├── utils/
│       │   ├── CocinaDashboard.jsx
│       │   └── CocinaDashboard.css
│       └── cajero/
│           ├── components/
│           ├── utils/
│           ├── CajeroDashboard.jsx
│           └── CajeroDashboard.css
├── public/                     ← Assets estáticos
│   ├── assets/
│   │   ├── icons/              ← Iconos SVG
│   │   ├── pwa-192x192.png
│   │   └── pwa-512x512.png
│   ├── manifest.json           ← PWA manifest
│   └── sw.js                   ← Service Worker
├── docs/                       ← Documentación
│   ├── README.md               ← Índice de documentación
│   ├── QUICK_START.md          ← Guía de inicio (15 min)
│   ├── ARCHITECTURE.md         ← Diagramas y flujos completos
│   ├── ADMIN_INTEGRATION.md    ← Integración Admin
│   ├── MESERO_INTEGRATION.md   ← Integración Mesero
│   ├── COCINERO_INTEGRATION.md ← Integración Cocinero
│   ├── CAJERO_INTEGRATION.md   ← Integración Cajero
│   └── db_schema.md            ← Esquema base de datos
├── index.html                  ← HTML principal
├── vite.config.js             ← Config Vite
├── firebase.json              ← Config Firebase
├── package.json               ← Dependencias
└── README.md                  ← Este archivo
```

---

## 👥 Roles y Responsabilidades

### 👨‍💼 Admin
- Gestionar usuarios (crear, editar, eliminar, asignar roles)
- Administrar menú (items, categorías, precios)
- Gestionar mesas (número, capacidad, estado)
- Ver reportes y analytics
- **Ruta:** `/admin`
- **Documentación:** [ADMIN_INTEGRATION.md](./docs/ADMIN_INTEGRATION.md)

### 🧑‍🍳 Mesero
- Crear órdenes
- Gestionar mesas (abrir, cerrar)
- Entregar órdenes a cocina
- Servir al cliente
- Coordinar con cocinero
- **Ruta:** `/mesero`
- **Documentación:** [MESERO_INTEGRATION.md](./docs/MESERO_INTEGRATION.md)

### 👨‍🍳 Cocinero
- Recibir órdenes en tiempo real
- Preparar platos
- Marcar items como listos
- Gestionar prioritización
- **Ruta:** `/cocinero`
- **Documentación:** [COCINERO_INTEGRATION.md](./docs/COCINERO_INTEGRATION.md)

### 💳 Cajero
- Procesar pagos
- Generar recibos
- Registrar transacciones
- Generar reportes diarios de caja
- **Ruta:** `/cajero`
- **Documentación:** [CAJERO_INTEGRATION.md](./docs/CAJERO_INTEGRATION.md)

---

## 📊 Modelo de Datos (Firebase Realtime Database)

### `/usuarios/{uid}`
Información de usuarios registrados.

```
{
  nombre: "Carlos Pérez",
  email: "carlos@ejemplo.com",
  rol: "Mesero" | "Admin" | "Cosinero" | "Cajero"
}
```

### `/menuItems/{menu_item_id}`
Catálogo de platos y bebidas.

```
{
  nombre: "Lomo Saltado",
  descripcion: "Trozos de carne con papas y arroz.",
  precio: 25.50,
  categoria: "Platos Fuerte",
  disponible: true,
  stock: 10,
  tiempoPreparacion: 15
}
```

### `/mesas/{mesa_id}`
Estado y capacidad de mesas.

```
{
  numero: 10,
  capacidad: 4,
  estado: "Disponible" | "Ocupada" | "Reservada"
}
```

### `/ordenes/{orden_id}` ⭐ CRÍTICO
Órdenes con items como subcolección.

```
{
  idMesa: "{mesa_id}",
  idMesero: "{uid}",
  idCocinero: "{uid}",
  idCajero: "{uid}",
  estado: "Pendiente" | "En Preparacion" | "Lista" | "Servida" | "Pagada",
  fechaCreacion: 1699654800000,
  total: 80.00,
  notas: "el saltado sin cebolla",
  items: {
    item-1: {
      idMenuItem: "{menu_item_id}",
      nombre: "Lomo Saltado",
      cantidad: 2,
      precioUnitario: 25.50,
      estado: false,
      tiempoEstimado: 15,
      fechaInicio: null,
      fechaFin: null
    }
  }
}
```

### `/pagos/{pago_id}`
Registro de transacciones de pago.

```
{
  idOrden: "{orden_id}",
  idCajero: "{uid}",
  idMesa: "{mesa_id}",
  monto: 85.50,
  metodoPago: "Efectivo" | "Tarjeta" | "Transferencia",
  descuento: 0,
  propina: 10.00,
  montoFinal: 95.50,
  fechaPago: 1699654980000,
  notas: "Cliente pagó con efectivo",
  numeroRecibo: "RCP-ABC123-20231115-0001"
}
```

### `/reporteDiario/{fecha}`
Resumen diario de ventas.

```
{
  fecha: "2023-11-15",
  montoTotal: 2450.75,
  cantidadTransacciones: 28,
  efectivo: { monto: 1200, cantidad: 15 },
  tarjeta: { monto: 1250.75, cantidad: 12 },
  transferencia: { monto: 0, cantidad: 0 },
  propinasTotal: 185.50,
  descuentosTotal: 50.00,
  cajero: { nombre: "Juan", uid: "{uid}" },
  horaApertura: 1699620000000,
  horaCierre: null
}
```

### `/reservas/{reserva_id}`
Gestión de reservas futuras.

```
{
  nombreCliente: "Ana Torres",
  telefonoCliente: "+51987654321",
  fechaHora: 1699740000000,
  numeroPersonas: 5,
  idMesaAsignada: "{mesa_id}",
  estado: "Confirmada" | "Cancelada"
}
```

---

## 🔐 Configuración Firebase

### 1. Credenciales
Editar `config/firebaseConfig.js` con tus credenciales:

```javascript
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
}
```

### 2. Reglas de Realtime Database
Copiar a Firebase Console → Realtime Database → Rules:

```json
{
  "rules": {
    "usuarios": {
      ".read": "auth != null",
      "$uid": {
        ".read": "auth.uid === $uid || root.child('usuarios').child(auth.uid).child('rol').val() === 'Admin'",
        ".write": "root.child('usuarios').child(auth.uid).child('rol').val() === 'Admin'"
      }
    },
    "ordenes": {
      ".read": "auth != null",
      "$orden_id": {
        ".read": "auth != null",
        ".write": "root.child('usuarios').child(auth.uid).child('rol').val() === 'Mesero'",
        "estado": {
          ".write": "root.child('usuarios').child(auth.uid).child('rol').val() === 'Cosinero' || root.child('usuarios').child(auth.uid).child('rol').val() === 'Cajero'"
        },
        "items": {
          "$item_id": {
            "estado": {
              ".write": "root.child('usuarios').child(auth.uid).child('rol').val() === 'Cosinero'"
            }
          }
        }
      }
    },
    "pagos": {
      ".read": "root.child('usuarios').child(auth.uid).child('rol').val() === 'Cajero' || root.child('usuarios').child(auth.uid).child('rol').val() === 'Admin'",
      ".write": "root.child('usuarios').child(auth.uid).child('rol').val() === 'Cajero'"
    },
    "menuItems": {
      ".read": "auth != null",
      ".write": "root.child('usuarios').child(auth.uid).child('rol').val() === 'Admin'"
    },
    "mesas": {
      ".read": "auth != null"
    },
    "reporteDiario": {
      ".read": "root.child('usuarios').child(auth.uid).child('rol').val() === 'Cajero' || root.child('usuarios').child(auth.uid).child('rol').val() === 'Admin'",
      ".write": "root.child('usuarios').child(auth.uid).child('rol').val() === 'Cajero'"
    }
  }
}
```

---

## 🛠️ Tech Stack

- **Frontend:** React 18.2.0
- **Build:** Vite 5.0.0
- **Routing:** React Router DOM 7.9.5
- **Backend:** Firebase (Authentication + Realtime Database)
- **Autenticación:** Email/Password + JWT tokens (localStorage)
- **Estado:** Context API + Firebase Listeners

### Dependencias Principales
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^7.9.5",
  "firebase": "^10.x"
}
```

---

## 🔄 Flujo Completo (Resumen)

```
1. MESERO: Crea orden
   └─ Estado: "Pendiente"

2. COCINERO: Toma orden
   └─ Estado: "En Preparacion"

3. COCINERO: Marca items listos
   └─ Estado: "Lista" (cuando todos listos)

4. MESERO: Levanta orden y sirve
   └─ Estado: "Servida"

5. CAJERO: Procesa pago
   └─ Estado: "Pagada"
   └─ Crea documento en /pagos/{id}
   └─ Actualiza /reporteDiario/{fecha}

6. ADMIN: Ve reportes y analytics
   └─ Acceso a /reporteDiario y todas las órdenes
```

---

## 📖 Próximos Pasos

### Paso 1: Selecciona tu Rol
- **Admin?** → Lee [ADMIN_INTEGRATION.md](./docs/ADMIN_INTEGRATION.md)
- **Mesero?** → Lee [MESERO_INTEGRATION.md](./docs/MESERO_INTEGRATION.md)
- **Cocinero?** → Lee [COCINERO_INTEGRATION.md](./docs/COCINERO_INTEGRATION.md)
- **Cajero?** → Lee [CAJERO_INTEGRATION.md](./docs/CAJERO_INTEGRATION.md)

### Paso 2: Copia Componentes
Cada documentación incluye componentes React listos para copiar

### Paso 3: Implementa la Lógica
Adapta los componentes a tu interfaz específica

### Paso 4: Publica Reglas
Firebase Console → Realtime Database → Rules → Publish

### Paso 5: Testing
Prueba flujo completo: orden → cocina → pago

---

## ⚙️ Troubleshooting

### "Cannot read property 'rol' of undefined"
→ El usuario no tiene documento en `/usuarios/{uid}`. Crear manualmente o registrar nuevamente.

### "Access denied" en Firebase
→ Las reglas no están publicadas. Ve a Firebase Console → Realtime Database → Rules → Publish

### Puerto ocupado
→ Vite usa el siguiente puerto disponible automáticamente (5173, 5174, ... 5179, etc.)

### Datos no se sincronizan en tiempo real
→ Verificar que el listener `onValue()` no tiene unsubscribe inmediato en cleanup

---

## 📞 Recursos

- **Firebase Docs:** https://firebase.google.com/docs
- **React Router:** https://reactrouter.com/
- **Vite:** https://vitejs.dev/
- **Documentación Completa:** [docs/README.md](./docs/README.md)

---

## 📝 Notas Importantes

- **Autenticación:** Firebase Authentication (Email/Password)
- **Sesión Persistente:** JWT tokens en localStorage
- **Base de Datos:** Realtime Database con reglas por rol
- **Real-time:** Todos los datos se sincronizan automáticamente
- **Seguridad:** Validación en cliente Y en servidor (reglas Firebase)

---

**¡Listo para implementar CASA MIA! 🎉**

Cada rol trabajar de forma independiente pero coordinada a través de Realtime Database.

*Versión 1.0 - Noviembre 2025*

