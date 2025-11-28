# Sistema CASA MIA - Arquitectura Completa

## 🏗️ Vista General del Sistema

```
┌─────────────────────────────────────────────────────────────────────┐
│                  CASA MIA - Sistema de Gestión                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    FIREBASE (Backend)                               │
│  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  Authentication │  │  Realtime        │  │  Cloud Functions │  │
│  │  (Email/Pass)   │  │  Database        │  │  (Backend Logic) │  │
│  └─────────────────┘  └──────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    REACT APP (Frontend)                             │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│  │  useAuth()   │  │  React       │  │  Realtime Listeners      │ │
│  │  Context     │  │  Router      │  │  (Database Sync)         │ │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘ │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │             LOGIN → Role-Based Routing                         ││
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       ││
│  │  │  /admin  │  │ /mesero  │  │/cocinero │  │ /cajero  │       ││
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘       ││
│  └────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │                   DASHBOARDS POR ROL                          ││
│  │                                                                 ││
│  │  ADMIN          MESERO          COCINERO       CAJERO           ││
│  │  ├─ Usuarios    ├─ Mesas        ├─ Órdenes    ├─ Pagos        ││
│  │  ├─ Menú        ├─ Órdenes      ├─ Items      ├─ Recibos      ││
│  │  ├─ Mesas       ├─ Notas        ├─ Timers     ├─ Reportes     ││
│  │  ├─ Reportes    ├─ Coordinación ├─ Progreso   └─ Caja         ││
│  │  └─ Roles       └─ Servicio     └─ Notif.                      ││
│  └────────────────────────────────────────────────────────────────┘│
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Flujo de Datos (Realtime Database)

```
┌──────────────────────────────────────────────────────────────────────┐
│  REALTIME DATABASE STRUCTURE                                        │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  /usuarios/{uid}                                                   │
│    ├─ nombre: string                                              │
│    ├─ email: string                                               │
│    └─ rol: "Admin" | "Mesero" | "Cosinero" | "Cajero"            │
│                                                                      │
│  /menuItems/{menu_item_id}                                        │
│    ├─ nombre: string                                              │
│    ├─ descripcion: string                                          │
│    ├─ precio: number                                               │
│    ├─ categoria: string                                            │
│    ├─ disponible: boolean                                          │
│    └─ stock: number                                                │
│                                                                      │
│  /mesas/{mesa_id}                                                  │
│    ├─ numero: number                                               │
│    ├─ capacidad: number                                            │
│    └─ estado: "Disponible" | "Ocupada" | "Reservada"              │
│                                                                      │
│  /ordenes/{orden_id}                  ← NODO CRÍTICO              │
│    ├─ idMesa: {mesa_id}                                            │
│    ├─ idMesero: {uid}                                              │
│    ├─ idCocinero: {uid}                                            │
│    ├─ idCajero: {uid}                                              │
│    ├─ estado: "Pendiente" → "En Preparacion" → "Lista"            │
│    │          → "Servida" → "Pagada"                               │
│    ├─ fechaCreacion: timestamp                                      │
│    ├─ total: number                                                │
│    ├─ notas: string                                                │
│    └─ items/{item_id}     ← SUBCOLECCIÓN                          │
│        ├─ idMenuItem: {menu_item_id}                               │
│        ├─ nombre: string                                            │
│        ├─ cantidad: number                                          │
│        ├─ precioUnitario: number                                    │
│        ├─ estado: boolean (preparado?)                             │
│        ├─ tiempoEstimado: number                                    │
│        ├─ fechaInicio: timestamp                                    │
│        └─ fechaFin: timestamp                                       │
│                                                                      │
│  /pagos/{pago_id}                    ← REGISTROS FINALES          │
│    ├─ idOrden: {orden_id}                                          │
│    ├─ idCajero: {uid}                                              │
│    ├─ idMesa: {mesa_id}                                            │
│    ├─ monto: number                                                │
│    ├─ metodoPago: "Efectivo" | "Tarjeta" | "Transferencia"       │
│    ├─ descuento: number                                            │
│    ├─ propina: number                                              │
│    ├─ montoFinal: number                                           │
│    ├─ fechaPago: timestamp                                         │
│    ├─ notas: string                                                │
│    └─ numeroRecibo: string                                         │
│                                                                      │
│  /reporteDiario/{fecha}              ← ANALYTICS                  │
│    ├─ fecha: "YYYY-MM-DD"                                          │
│    ├─ montoTotal: number                                           │
│    ├─ cantidadTransacciones: number                                │
│    ├─ efectivo: { monto, cantidad }                                │
│    ├─ tarjeta: { monto, cantidad }                                 │
│    ├─ transferencia: { monto, cantidad }                           │
│    ├─ propinasTotal: number                                        │
│    ├─ descuentosTotal: number                                      │
│    ├─ cajero: { nombre, uid }                                      │
│    ├─ horaApertura: timestamp                                      │
│    └─ horaCierre: timestamp                                        │
│                                                                      │
│  /reservas/{reserva_id}              ← FUTURO (NO CRÍTICO)        │
│    ├─ nombreCliente: string                                        │
│    ├─ telefonoCliente: string                                      │
│    ├─ fechaHora: timestamp                                         │
│    ├─ numeroPersonas: number                                       │
│    ├─ idMesaAsignada: {mesa_id}                                    │
│    └─ estado: "Confirmada" | "Cancelada"                           │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo de Orden Completo

### 1️⃣ CREACIÓN (Mesero)

```
Mesero abre app → elige mesa
  │
  ├─ Si mesa está "Disponible" → puede crear orden
  │
  ├─ Mesero selecciona items del menú
  │
  ├─ Mesero agrega notas (ej: "sin cebolla")
  │
  └─ Mesero confirma → Sistema crea /ordenes/{orden_id}
     {
       idMesa: "mesa-10",
       idMesero: "uid-mesero-123",
       estado: "Pendiente",
       fechaCreacion: 1699654800000,
       total: 85.50,
       notas: "sin cebolla en el lomo",
       items: {
         item-1: { nombre: "Lomo Saltado", cantidad: 2, ... },
         item-2: { nombre: "Arroz", cantidad: 2, ... }
       }
     }
     
     Sistema también:
     ├─ Actualiza mesa: estado = "Ocupada"
     └─ Notifica a Cocinero (observa /ordenes)
```

### 2️⃣ PREPARACIÓN (Cocinero)

```
Cocinero ve orden en cola
  │
  ├─ Orden en estado "Pendiente"
  │
  ├─ Cocinero toca "Tomar Orden"
  │
  └─ Sistema actualiza:
     {
       idCocinero: "uid-cocinero-456",
       estado: "En Preparacion"
     }

Cocinero prepara platos
  │
  ├─ Por cada plato listo → marca item.estado = true
  │
  ├─ Ejemplo: Marca "Lomo Saltado" como listo
  │
  └─ Sistema actualiza /ordenes/{orden_id}/items/item-1:
     {
       estado: true,
       fechaFin: 1699654950000
     }

Cocinero termina todo
  │
  ├─ Todos los items tienen estado = true
  │
  └─ Sistema detecta → Orden pasa a "Lista"
     └─ Notifica a Mesero: "Orden lista para servir"
```

### 3️⃣ SERVICIO (Mesero)

```
Mesero ve orden con estado "Lista"
  │
  ├─ Mesero levanta orden de cocina
  │
  ├─ Mesero entrega al cliente
  │
  └─ Mesero marca en app: estado = "Servida"
     
     Sistema actualiza:
     {
       estado: "Servida"
     }
     
     (Opcional: Mesero ingresa notas de servicio)
```

### 4️⃣ PAGO (Cajero)

```
Cajero ve órdenes con estado "Servida"
  │
  ├─ Cliente pide la cuenta → Cajero abre orden
  │
  ├─ Cajero ve detalles:
  │  ├─ Total: S/ 85.50
  │  ├─ Items: 4
  │  └─ Notas
  │
  ├─ Cajero aplica descuento (opcional)
  │
  ├─ Cajero recibe dinero y selecciona método de pago
  │
  ├─ Cajero ingresa propina (opcional)
  │
  ├─ Cajero confirma pago
  │
  └─ Sistema crea /pagos/{pago_id}:
     {
       idOrden: "orden-xyz",
       idCajero: "uid-cajero-789",
       idMesa: "mesa-10",
       monto: 85.50,
       metodoPago: "Efectivo",
       descuento: 0,
       propina: 10.00,
       montoFinal: 95.50,
       fechaPago: 1699654980000,
       numeroRecibo: "RCP-ABC123-20231115-0001"
     }
     
     Sistema también:
     ├─ Actualiza orden: estado = "Pagada"
     ├─ Libera mesa: estado = "Disponible"
     └─ Actualiza /reporteDiario/{fecha}:
        └─ Incrementa montos y cantidades
        
     Recibo impreso:
     ┌──────────────────────┐
     │    CASA MIA          │
     │    Recibo #0001      │
     ├──────────────────────┤
     │ Mesa: 10             │
     │ Lomo Saltado x2  50  │
     │ Arroz x2         35.5│
     ├──────────────────────┤
     │ Subtotal:        85.5│
     │ Descuento:        0  │
     │ Propina:        10   │
     │ TOTAL:          95.5 │
     ├──────────────────────┤
     │ 15-Nov-2023 14:23   │
     │ Cajero: Juan        │
     └──────────────────────┘
```

### 5️⃣ ANÁLISIS (Admin)

```
Admin abre Dashboard
  │
  ├─ Ve /reporteDiario para hoy:
  │  ├─ Total ventas: S/ 2,450.75
  │  ├─ Transacciones: 28
  │  ├─ Efectivo: S/ 1,200 (15 transacciones)
  │  ├─ Tarjeta: S/ 1,250.75 (12 transacciones)
  │  └─ Propinas totales: S/ 185.50
  │
  ├─ Ve órdenes pagadas:
  │  └─ Puede filtrar por fecha, mesero, cocinero
  │
  └─ Puede ver análisis por categoría, hora, etc.
```

---

## 🔒 Seguridad por Rol

### Autenticación:
- Firebase Auth (Email/Password)
- JWT almacenado en localStorage
- Session persist automático

### Autorización (Realtime Database Rules):

```
ADMIN:
├─ Leer/escribir: /usuarios
├─ Leer/escribir: /menuItems
├─ Leer/escribir: /mesas
├─ Leer/escribir: /reservas
├─ Leer/escribir: /reporteDiario
└─ Leer: /ordenes, /pagos

MESERO:
├─ Crear/actualizar: /ordenes
├─ Leer: /menuItems, /mesas
├─ Leer: Propias órdenes en /pagos
└─ NO puede: Cambiar estado de orden

COCINERO:
├─ Leer: /ordenes con estado "Pendiente" o "En Preparacion"
├─ Actualizar: ordenes.idCocinero, ordenes.estado
├─ Actualizar: ordenes.items[*].estado
├─ Leer: /menuItems
└─ NO puede: Crear órdenes, acceder a /pagos

CAJERO:
├─ Leer: /ordenes con estado "Servida"
├─ Crear: /pagos
├─ Actualizar: /ordenes.estado = "Pagada"
├─ Leer/escribir: /reporteDiario
├─ Leer: /mesas
└─ NO puede: Crear órdenes, modificar menú
```

---

## 📱 Responsabilidades por Rol

### 👨‍💼 ADMIN
- Crear/gestionar usuarios del sistema
- Asignar y cambiar roles
- Administrar menú (agregar/editar/eliminar items)
- Gestionar mesas (agregar/actualizar capacidad)
- Gestionar reservas
- Ver reportes y análisis
- Gestionar descuentos/promociones (Opcional)

**Complejidad:** Alta
**Frecuencia:** Diaria (cambios de menú, usuarios)

---

### 🧑‍🍳 MESERO
- Abrir/cerrar mesas
- Crear órdenes
- Agregar notas especiales
- Entregar órdenes a cocina
- Servir al cliente
- Coordinar con cocinero si hay cambios
- Ver estado de órdenes en cocina

**Complejidad:** Media
**Frecuencia:** Muy alta (múltiples órdenes por turno)

---

### 👨‍🍳 COCINERO
- Recibir órdenes
- Gestionar cola de preparación
- Preparar platos
- Marcar items como listos
- Coordinar con otros cocineros
- Comunicar si hay problemas (falta stock, etc.)

**Complejidad:** Media
**Frecuencia:** Muy alta (simultáneamente con múltiples órdenes)

---

### 💳 CAJERO
- Recibir órdenes listas para pago
- Procesar diferentes métodos de pago
- Generar recibos
- Registrar descuentos/propinas
- Generar reporte diario
- Cerrar caja al final del turno

**Complejidad:** Media-Alta
**Frecuencia:** Alta (después de cada orden servida)

---

## 🛠️ Stack Técnico

### Frontend:
- **React 18.2.0** - UI framework
- **React Router 7.9.5** - Routing client-side
- **Vite 5.0.0** - Build tool
- **Firebase SDK** - Autenticación y realtime data

### Backend:
- **Firebase Authentication** - Gestión de usuarios
- **Firebase Realtime Database** - Base de datos NoSQL
- **Cloud Functions** (Opcional) - Lógica backend segura
- **Firebase Rules** - Autorización granular

### Versioning:
- Node.js 18+
- npm 9+

---

## 📦 Dependencias Principales

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^7.9.5",
    "firebase": "^10.x"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0"
  }
}
```

---

## 📈 Escalabilidad y Limitaciones

### ✅ Ventajas Realtime Database:
- Sincronización en tiempo real
- Bueno para datos pequeños-medianos
- Excelente para coordinación en vivo

### ⚠️ Limitaciones:
- Máximo 32 niveles de anidamiento
- Mejor con datos desnormalizados
- Puede ser costoso a gran escala

### 🎯 Recomendaciones:
- Limitar subcolecciones a 2 niveles (ej: /ordenes/{id}/items/{id})
- Usar índices para queries complejas
- Hacer backups regulares
- Monitorear uso de ancho de banda

---

## 🚀 Deployment

### Desarrollo:
```bash
npm run dev
```
Servidor corre en `http://localhost:5179`

### Build:
```bash
npm run build
```
Genera carpeta `dist/` lista para producción

### Deploy a Firebase Hosting:
```bash
npm run build
firebase deploy --only hosting
```

### Deploy Cloud Functions:
```bash
firebase deploy --only functions
```

---

## 📋 Checklist de Implementación

### Fase 1: Configuración Base ✅
- [x] Proyecto React + Vite
- [x] Firebase configurado
- [x] Autenticación implementada
- [x] Router con role-based access

### Fase 2: Documentación ✅
- [x] ADMIN_INTEGRATION.md
- [x] MESERO_INTEGRATION.md
- [x] COCINERO_INTEGRATION.md
- [x] CAJERO_INTEGRATION.md

### Fase 3: Implementación Frontend 🔄
- [ ] Dashboard Admin completo
- [ ] Dashboard Mesero con TablesGrid
- [ ] Dashboard Cocinero con OrderQueue
- [ ] Dashboard Cajero con PaymentProcessor

### Fase 4: Cloud Functions 🔄
- [ ] `assignRole()` - Asignar roles de forma segura
- [ ] `createOrder()` - Validar y crear orden
- [ ] `updateOrderStatus()` - Cambiar estado de orden
- [ ] `processPayment()` - Procesar pago y actualizar caja

### Fase 5: Testing 🔄
- [ ] Testing E2E del flujo completo
- [ ] Testing de reglas Firebase
- [ ] Testing de autenticación
- [ ] Testing de permiso por rol

### Fase 6: Producción 🔄
- [ ] Valores en .env configurados
- [ ] Rules publicadas en Firebase
- [ ] Cloud Functions desplegadas
- [ ] Estilos finalizados
- [ ] Documentación en sitio interno

---

## 🎓 Próximos Pasos para tu Equipo

1. **Divide el trabajo por rol:**
   - Equipo A: Admin
   - Equipo B: Mesero
   - Equipo C: Cocinero
   - Equipo D: Cajero

2. **Cada equipo:**
   - Lee su documento de integración
   - Copia los componentes React
   - Implementa la lógica
   - Valida con checklist

3. **Testing paralelo:**
   - Cada rol prueba su funcionalidad
   - Luego prueba flujo completo (orden → pago)

4. **Deployment:**
   - Reglas a Firebase
   - Cloud Functions (si necesario)
   - Build y deploy a hosting

---

**¡Tu sistema está listo para implementación!** 🎉

Cada rol es independiente pero se coordina a través de Realtime Database.
Todos usan la misma autenticación y routing.

---

*Versión 1.0 - Noviembre 2025*
