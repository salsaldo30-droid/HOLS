# Integración — Interfaz y funciones del Mesero

Este documento contiene todo lo que el equipo necesita para crear la interfaz y las funciones del mesero usando Firebase Authentication y Realtime Database.

---

## 1) Resumen de responsabilidades del Mesero

Un mesero puede:
- Ver las mesas disponibles, ocupadas y reservadas.
- Crear nuevas órdenes para una mesa.
- Agregar platos a una orden (desde el menú).
- Ver el estado de sus órdenes (Pendiente, En Preparación, Lista, Servida, Pagada).
- Marcar una orden como servida o pagada.
- Ver las reservas del restaurante.
- Tomar notas en las órdenes (por ejemplo: "sin cebolla").

Un mesero NO puede:
- Eliminar o modificar el menú.
- Cambiar roles de otros usuarios.
- Ver reportes de ventas (eso es del Admin).
- Modificar el estado de mesas (excepto marcar como ocupada/disponible al crear/cerrar orden).

---

## 2) Modelo de datos relevante (Realtime Database)

### `/menuItems/{menu_item_id}`
```
{
  nombre: "Lomo Saltado",
  descripcion: "Trozos de carne con papas y arroz.",
  precio: 25.50,
  categoria: "Platos Fuerte",
  disponible: true,
  stock: 10
}
```
**Permisos:** Mesero puede leer. Solo Admin/Cosinero pueden escribir.

### `/mesas/{mesa_id}`
```
{
  numero: 10,
  capacidad: 4,
  estado: "Disponible"  // "Disponible", "Ocupada", "Reservada"
}
```
**Permisos:** Mesero puede leer y cambiar estado (ocupada ↔ disponible al crear/cerrar orden). Solo Admin puede modificar otros campos.

### `/ordenes/{orden_id}`
```
{
  idMesa: "{mesa_id}",
  idMesero: "{uid}",
  estado: "Pendiente",  // "Pendiente", "En Preparacion", "Lista", "Servida", "Pagada"
  fechaCreacion: 1702000000000,
  total: 80.00,
  notas: "el saltado sin cebolla"
}
```

### `/ordenes/{orden_id}/items/{item_id}` (subcolección)
```
{
  idMenuItem: "{menu_item_id}",
  nombre: "Lomo Saltado",
  cantidad: 2,
  precioUnitario: 25.50,
  estado: false  // true = preparado, false = pendiente
}
```
**Permisos:** Mesero puede crear/leer sus propias órdenes. Cocina puede leer y actualizar estado de items.

### `/reservas/{reserva_id}`
```
{
  nombreCliente: "Ana Torres",
  telefonoCliente: "+51987654321",
  fechaHora: 1702086400000,
  numeroPersonas: 5,
  idMesaAsignada: "{mesa_id}",  // opcional
  estado: "Confirmada"  // "Confirmada", "Completada", "Cancelada"
}
```
**Permisos:** Mesero puede leer. Solo Admin puede crear/modificar.

---

## 3) Reglas de Realtime Database (para Mesero)

Pegar en Firebase Console → Realtime Database → Rules:

```json
{
  "rules": {
    "usuarios": {
      "$uid": {
        ".read": "auth != null && auth.uid == $uid",
        ".write": "auth != null && auth.uid == $uid"
      }
    },
    "menuItems": {
      ".read": true,
      ".write": "auth != null && (auth.token.role == 'Admin' || auth.token.role == 'Cocinero')"
    },
    "mesas": {
      ".read": true,
      ".write": "auth != null && (auth.token.role == 'Mesero' || auth.token.role == 'Admin')"
    },
    "ordenes": {
      ".read": "auth != null",
      "$orden_id": {
        ".write": "auth != null && (data.child('idMesero').val() == auth.uid || auth.token.role == 'Admin')",
        "items": {
          ".write": "auth != null && (root.child('ordenes').child($orden_id).child('idMesero').val() == auth.uid || auth.token.role == 'Admin')"
        }
      }
    },
    "reservas": {
      ".read": true,
      ".write": "auth != null && auth.token.role == 'Admin'"
    }
  }
}
```

**Notas:**
- Mesero puede leer todas las órdenes pero solo puede escribir en sus propias órdenes.
- Mesero puede leer y cambiar estado de mesas (para marcar ocupada/disponible).
- Mesero puede leer reservas pero solo Admin puede crearlas.

---

## 4) Flujo de uso — Crear una orden

1. **Mesero ve la lista de mesas** (componente `TablesGrid`).
2. **Selecciona una mesa disponible** y hace click en "Nueva orden".
3. **Se abre un modal** con el menú (componente `MenuSelector`).
4. **Mesero agrega platos a la orden** (qty, notas, etc).
5. **Confirma la orden** → Frontend crea documento en `/ordenes/{orden_id}` con `idMesa` e `idMesero`, y actualiza estado de mesa a "Ocupada".
6. **La orden se envía a cocina** → Cocinero ve el item con estado `false` (pendiente) en `/ordenes/{orden_id}/items`.
7. **Cocinero marca como listo** → Actualiza `estado: true` en el item.
8. **Mesero ve "Lista"** en su dashboard y puede marcar orden como "Servida".
9. **Cajero cobra** → Marca orden como "Pagada" (o mesero si están integrados).

---

## 5) Componentes React sugeridos para el Mesero

```
src/pages/MeseroDashboard.jsx (página principal)
├── src/components/mesero/
│   ├── TablesGrid.jsx          (grid de mesas, click abre orden)
│   ├── OrderModal.jsx          (modal para crear/editar orden)
│   ├── MenuSelector.jsx        (lista de items del menú)
│   ├── OrdersList.jsx          (lista de órdenes activas del mesero)
│   ├── OrderDetail.jsx         (detalle de una orden, ver estado items)
│   ├── NotesInput.jsx          (campo para notas de la orden)
│   └── ReservationsList.jsx    (lista de reservas del día)
```

---

## 6) Ejemplo: componente `TablesGrid`

```jsx
// src/components/mesero/TablesGrid.jsx
import React, { useEffect, useState } from 'react'
import { ref, onValue } from 'firebase/database'
import { db } from '../../config/firebase.init.js'

export default function TablesGrid({ onSelectTable }) {
  const [tables, setTables] = useState({})

  useEffect(() => {
    const tablesRef = ref(db, 'mesas')
    const unsub = onValue(tablesRef, snapshot => {
      setTables(snapshot.val() || {})
    })
    return () => unsub()
  }, [])

  const getStatusColor = (estado) => {
    switch (estado) {
      case 'Disponible':
        return '#90EE90'  // Verde
      case 'Ocupada':
        return '#FFB6C1'  // Rojo
      case 'Reservada':
        return '#87CEEB'  // Azul
      default:
        return '#DDD'
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
      {Object.entries(tables).map(([id, table]) => (
        <div
          key={id}
          onClick={() => onSelectTable(id, table)}
          style={{
            padding: '20px',
            background: getStatusColor(table.estado),
            borderRadius: '6px',
            cursor: table.estado === 'Disponible' ? 'pointer' : 'default',
            textAlign: 'center',
            border: '1px solid #333'
          }}
        >
          <h3>Mesa {table.numero}</h3>
          <p>{table.capacidad} personas</p>
          <p><strong>{table.estado}</strong></p>
        </div>
      ))}
    </div>
  )
}
```

---

## 7) Ejemplo: crear una orden (lógica)

```js
// src/api/mesero.js
import { ref, set, push, update } from 'firebase/database'
import { db } from '../config/firebase.init.js'

export async function createOrder(idMesa, idMesero, items, notas = '') {
  // 1) Crear documento en /ordenes/{orden_id}
  const orderRef = ref(db, 'ordenes')
  const newOrderRef = push(orderRef)
  
  const order = {
    idMesa,
    idMesero,
    estado: 'Pendiente',
    fechaCreacion: Date.now(),
    total: items.reduce((sum, item) => sum + item.cantidad * item.precioUnitario, 0),
    notas
  }
  
  await set(newOrderRef, order)
  
  // 2) Agregar items como subcolección
  for (const item of items) {
    const itemRef = ref(db, `ordenes/${newOrderRef.key}/items/${item.idMenuItem}`)
    await set(itemRef, {
      idMenuItem: item.idMenuItem,
      nombre: item.nombre,
      cantidad: item.cantidad,
      precioUnitario: item.precioUnitario,
      estado: false  // pendiente en cocina
    })
  }
  
  // 3) Marcar mesa como ocupada
  await update(ref(db, `mesas/${idMesa}`), { estado: 'Ocupada' })
  
  return newOrderRef.key
}
```

---

## 8) Flujo de autenticación (reutilizar del proyecto)

- Mesero se autentica con email/password.
- Firebase Auth asigna UID.
- Frontend usa [`useAuth()`](../../src/useAuth.jsx ) hook para obtener `user.rol`.
- Si `user.rol === 'Mesero'`, Router redirige a `/mesero`.
- Si intenta acceder a `/admin`, es denegado (solo Admin).

---

## 9) Consideraciones de seguridad

- **Mesero solo ve sus propias órdenes** (aunque lee todas, las reglas de DB protegen la escritura).
- **Mesero no puede crear órdenes para otra mesa sin ser él** (validar `idMesero` en el frontend y backend).
- **No exponer datos sensibles** (no mostrar precios de costo, márgenes, etc).
- **Auditar cambios**: considerar escribir en `/logs/{timestamp}` cuando se marca orden como pagada.

---

## 10) Aceptación / Checklist para Mesero

- [ ] **Ver mesas**: Grid muestra todas las mesas con estado y capacidad.
- [ ] **Crear orden**: Click en mesa disponible abre modal con menú.
- [ ] **Agregar platos**: Mesero elige cantidad y agrega a carrito.
- [ ] **Guardar orden**: Confirmar crea documento `/ordenes/{orden_id}` y marca mesa como Ocupada.
- [ ] **Ver órdenes activas**: Dashboard muestra órdenes del mesero con estado (Pendiente, En Preparación, Lista).
- [ ] **Marcar como servida**: Botón en detalle de orden para cambiar estado a Servida.
- [ ] **Ver reservas**: Mostrar próximas reservas del día (solo lectura).
- [ ] **Notas en orden**: Campo de texto para notas especiales ("sin sal", etc).
- [ ] **Cerrar orden**: Cambiar mesa a Disponible cuando orden es Pagada.

---

## 11) Stack técnico

- **Frontend**: React (ya existe)
- **Auth**: Firebase Authentication (email/password)
- **DB**: Realtime Database (paths: /menuItems, /mesas, /ordenes, /reservas, /usuarios)
- **Rutas**: React Router (`/mesero` ruta protegida)
- **Estado**: `useAuth()` hook + `onValue()` listeners de Realtime DB

---

## 12) Próximos pasos

1. Crear archivo `src/pages/MeseroDashboard.jsx` (componente raíz).
2. Crear componentes en `src/components/mesero/` (TablesGrid, OrderModal, etc).
3. Crear helpers en `src/api/mesero.js` (createOrder, updateOrderStatus, etc).
4. Actualizar `src/App.jsx` con ruta `/mesero` protegida.
5. Implementar lógica de estado compartido entre Mesero y Cocina (listeners a órdenes).
6. Publicar reglas de Realtime Database en consola.

---

**Contactar a:** [nombre del lead backend] para coordinar reglas de DB y Cloud Functions si se necesitan.

**Documento relacionado:** `docs/ADMIN_INTEGRATION.md` (contiene reglas generales y flujos de Auth).
