# Integración — Interfaz y funciones del Cosinero

Este documento contiene todo lo que el equipo necesita para crear la interfaz y las funciones del cosinero usando Firebase Authentication y Realtime Database.

**Resumen rápido:**
- Autenticación: Firebase Auth (Email/Password) + JWT token en localStorage
- Datos: Realtime Database (estructura definida abajo)
- Responsabilidades: Recibir órdenes, preparar platos, marcar items como listos
- Frontend: React + Firebase client SDK (importar `auth` y `db` desde `config/firebase.init.js`)

---

## 1) Responsabilidades del Cosinero

El rol de **Cosinero** es responsable de:

1. **Recibir Órdenes**: Ver órdenes nuevas en tiempo real (estado "Pendiente")
2. **Gestionar Preparación**: Cambiar estado de orden a "En Preparación"
3. **Actualizar Items**: Marcar platos individuales como listos (preparados)
4. **Coordinar con Mesero**: Notificar cuando orden está lista para servir
5. **Priorizar Órdenes**: Gestionar queue de preparación por urgencia
6. **Consultar Stock**: Verificar disponibilidad antes de preparar
7. **Gestionar Tiempo**: Estimar tiempo de preparación por plato

---

## 2) Modelo de datos (Realtime Database)

### Rutas existentes que usa el Cosinero:

#### `/ordenes/{orden_id}`
```
idMesa: {mesa_id}
idMesero: {uid}
idCocinero: {uid} (uid del cocinero asignado, null mientras no lo toma)
estado: "Pendiente" | "En Preparacion" | "Lista" | "Servida" | "Pagada"
fechaCreacion: timestamp
total: number
notas: string
items/
  {item_id}/
    idMenuItem: {menu_item_id}
    nombre: "Lomo Saltado"
    cantidad: 2
    precioUnitario: 25.50
    estado: false → true (cuando está preparado)
    tiempoEstimado: 15 (minutos)
    fechaInicio: timestamp (cuando el cocinero comienza)
    fechaFin: timestamp (cuando marca como listo)
```

#### `/menuItems/{menu_item_id}`
```
nombre: string
descripcion: string
precio: number
categoria: string
disponible: boolean
stock: number
tiempoPreparacion: number (minutos estimados)
```

#### `/mesas/{mesa_id}`
```
numero: number
capacidad: number
estado: "Disponible" | "Ocupada" | "Reservada"
```

#### `/usuarios/{uid}`
```
nombre: string
email: string
rol: "Admin" | "Cosinero" | "Mesero" | "Cajero"
```

### **Nueva rama: `/tiemposPromedio/{categoria}` ** (para análisis de rendimiento)

```
categoria: "Platos Fuerte"
tiempoPromedio: 18.5 (minutos)
tiempoMinimo: 12
tiempoMaximo: 35
cantidadItems: 127
ultimaActualizacion: timestamp
```

---

## 3) Reglas de Realtime Database (Seguridad)

Copia estas reglas a Firebase Console → Realtime Database → Rules:

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
        "idCocinero": {
          ".write": "root.child('usuarios').child(auth.uid).child('rol').val() === 'Cosinero'"
        },
        "estado": {
          ".write": "root.child('usuarios').child(auth.uid).child('rol').val() === 'Cosinero' || root.child('usuarios').child(auth.uid).child('rol').val() === 'Cajero'"
        },
        "items": {
          ".write": "root.child('usuarios').child(auth.uid).child('rol').val() === 'Mesero'",
          "$item_id": {
            "estado": {
              ".write": "root.child('usuarios').child(auth.uid).child('rol').val() === 'Cosinero'"
            }
          }
        }
      }
    },
    "menuItems": {
      ".read": "auth != null",
      ".write": "root.child('usuarios').child(auth.uid).child('rol').val() === 'Admin'"
    },
    "mesas": {
      ".read": "auth != null",
      "$mesa_id": {
        ".read": "auth != null"
      }
    },
    "tiemposPromedio": {
      ".read": "auth != null",
      ".write": "root.child('usuarios').child(auth.uid).child('rol').val() === 'Admin' || root.child('usuarios').child(auth.uid).child('rol').val() === 'Cosinero'"
    }
  }
}
```

---

## 4) Flujo de Preparación (Workflow)

```
[Orden creada por Mesero, estado "Pendiente"]
        ↓
[Cosinero ve en cola de órdenes]
        ↓
[Cosinero toma orden: toca botón "Tomar Orden"]
        ↓
[Sistema: idCocinero = uid actual, estado = "En Preparacion"]
        ↓
[Cosinero ve detalles: items, notas, etc.]
        ↓
[Para cada item, cuando está listo:]
  [Cosinero marca item: estado = true, fechaFin = ahora]
        ↓
[Cuando TODOS los items tienen estado = true:]
  [Sistema: estado = "Lista"]
        ↓
[Mesero ve orden como "Lista"]
        ↓
[Mesero levanta orden y cambia estado a "Servida"]
        ↓
[Fin de ciclo de cocina]
```

---

## 5) Ejemplos de Componentes React

### Componente: `OrderQueue.jsx`

Muestra la cola de órdenes pendientes y en preparación.

```jsx
import React, { useEffect, useState } from 'react'
import { db } from '../../config/firebase.init.js'
import { ref, onValue, update } from 'firebase/database'
import { useAuth } from '../../src/useAuth.jsx'

export default function OrderQueue({ onSelectOrder, selectedOrderId }) {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ordenesRef = ref(db, 'ordenes')
    const unsubscribe = onValue(ordenesRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        // Filtrar órdenes pendientes o en preparación
        const activeOrders = Object.entries(data)
          .filter(([_, order]) => ['Pendiente', 'En Preparacion'].includes(order.estado))
          .map(([id, order]) => ({ id, ...order }))
          .sort((a, b) => {
            // Órdenes tomadas primero, luego por fecha
            if ((a.idCocinero === user.uid) && (b.idCocinero !== user.uid)) return -1
            if ((a.idCocinero !== user.uid) && (b.idCocinero === user.uid)) return 1
            return a.fechaCreacion - b.fechaCreacion
          })
        setOrders(activeOrders)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user.uid])

  const handleTakeOrder = async (orderId) => {
    try {
      await update(ref(db, `ordenes/${orderId}`), {
        idCocinero: user.uid,
        estado: 'En Preparacion'
      })
      onSelectOrder(orderId)
    } catch (error) {
      alert(`Error al tomar orden: ${error.message}`)
    }
  }

  if (loading) return <div>Cargando órdenes...</div>

  const pendingOrders = orders.filter(o => !o.idCocinero)
  const myOrders = orders.filter(o => o.idCocinero === user.uid)
  const otherOrders = orders.filter(o => o.idCocinero && o.idCocinero !== user.uid)

  return (
    <div style={{ padding: '20px' }}>
      <h2>📋 Cola de Órdenes</h2>

      {/* Mis Órdenes */}
      {myOrders.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#2196f3' }}>🍳 Mis Órdenes ({myOrders.length})</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
            {myOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                isMine={true}
                isSelected={selectedOrderId === order.id}
                onSelect={() => onSelectOrder(order.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Órdenes Pendientes */}
      {pendingOrders.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#f57c00' }}>⏳ Pendientes ({pendingOrders.length})</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
            {pendingOrders.map((order) => (
              <div
                key={order.id}
                style={{
                  border: '2px solid #f57c00',
                  padding: '15px',
                  borderRadius: '8px',
                  backgroundColor: '#fff8f0',
                  cursor: 'pointer'
                }}
                onClick={() => handleTakeOrder(order.id)}
              >
                <h4 style={{ margin: '0 0 10px 0' }}>Mesa {order.numero}</h4>
                <p><strong>Items:</strong> {Object.keys(order.items || {}).length}</p>
                <p style={{ fontSize: '0.9em', color: '#666' }}>
                  {new Date(order.fechaCreacion).toLocaleTimeString()}
                </p>
                {order.notas && <p style={{ color: '#d32f2f', fontStyle: 'italic' }}>Notas: {order.notas}</p>}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleTakeOrder(order.id)
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#f57c00',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginTop: '10px',
                    fontWeight: 'bold'
                  }}
                >
                  Tomar Orden
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Órdenes de Otros Cocineros */}
      {otherOrders.length > 0 && (
        <div>
          <h3 style={{ color: '#999' }}>👨‍🍳 En Preparación (otros) ({otherOrders.length})</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
            {otherOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                isMine={false}
                onSelect={() => {}}
              />
            ))}
          </div>
        </div>
      )}

      {orders.length === 0 && (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <p style={{ fontSize: '1.2em', color: '#999' }}>✓ No hay órdenes en este momento</p>
        </div>
      )}
    </div>
  )
}

function OrderCard({ order, isMine, isSelected, onSelect }) {
  const totalItems = Object.keys(order.items || {}).length
  const readyItems = Object.values(order.items || {}).filter(item => item.estado).length

  return (
    <div
      onClick={onSelect}
      style={{
        border: isSelected ? '3px solid #2196f3' : '1px solid #ddd',
        padding: '15px',
        borderRadius: '8px',
        backgroundColor: isSelected ? '#e3f2fd' : '#f9f9f9',
        cursor: isMine ? 'pointer' : 'default',
        opacity: isMine ? 1 : 0.7,
        transition: 'all 0.3s'
      }}
    >
      <h4 style={{ margin: '0 0 10px 0' }}>Mesa {order.numero}</h4>
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
          <strong>Items:</strong>
          <span>{readyItems}/{totalItems}</span>
        </div>
        <div style={{ backgroundColor: '#e0e0e0', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
          <div
            style={{
              backgroundColor: readyItems === totalItems ? '#4caf50' : '#2196f3',
              height: '100%',
              width: `${(readyItems / totalItems) * 100}%`,
              transition: 'width 0.3s'
            }}
          />
        </div>
      </div>
      <p style={{ fontSize: '0.85em', color: '#666', margin: '0' }}>
        {new Date(order.fechaCreacion).toLocaleTimeString()}
      </p>
      {order.notas && (
        <p style={{ fontSize: '0.85em', color: '#d32f2f', fontStyle: 'italic', margin: '5px 0 0 0' }}>
          📝 {order.notas}
        </p>
      )}
    </div>
  )
}
```

### Componente: `OrderDetail.jsx`

Muestra el detalle de una orden con posibilidad de marcar items como listos.

```jsx
import React, { useEffect, useState } from 'react'
import { db } from '../../config/firebase.init.js'
import { ref, get, update } from 'firebase/database'
import { useAuth } from '../../src/useAuth.jsx'

export default function OrderDetail({ orderId, onBack }) {
  const { user } = useAuth()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [allItemsReady, setAllItemsReady] = useState(false)

  useEffect(() => {
    const loadOrder = async () => {
      const orderRef = ref(db, `ordenes/${orderId}`)
      const snapshot = await get(orderRef)
      if (snapshot.exists()) {
        const orderData = snapshot.val()
        setOrder({ id: orderId, ...orderData })

        // Verificar si todos los items están listos
        const items = Object.values(orderData.items || {})
        setAllItemsReady(items.length > 0 && items.every(item => item.estado))
      }
      setLoading(false)
    }

    loadOrder()
  }, [orderId])

  const handleToggleItemReady = async (itemId, currentState) => {
    try {
      const newState = !currentState
      const now = Date.now()

      await update(ref(db, `ordenes/${orderId}/items/${itemId}`), {
        estado: newState,
        ...(newState && { fechaFin: now })
      })

      // Actualizar estado local
      const updatedOrder = { ...order }
      updatedOrder.items[itemId].estado = newState
      if (newState) {
        updatedOrder.items[itemId].fechaFin = now
      }
      setOrder(updatedOrder)

      // Verificar si todos están listos
      const items = Object.values(updatedOrder.items)
      const allReady = items.every(item => item.estado)
      setAllItemsReady(allReady)

      // Si todos están listos, actualizar orden a "Lista"
      if (allReady) {
        await update(ref(db, `ordenes/${orderId}`), {
          estado: 'Lista'
        })
      }
    } catch (error) {
      alert(`Error al actualizar item: ${error.message}`)
    }
  }

  if (loading) return <div>Cargando orden...</div>
  if (!order) return <div>Orden no encontrada</div>

  const items = Object.entries(order.items || {})

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={onBack}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ← Atrás
        </button>
        <h2 style={{ margin: '0' }}>Mesa {order.numero}</h2>
        <div style={{ width: '80px' }}></div>
      </div>

      {/* Estado */}
      <div
        style={{
          backgroundColor: allItemsReady ? '#c8e6c9' : '#fff9c4',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center'
        }}
      >
        <p style={{ margin: '0', fontWeight: 'bold' }}>
          {allItemsReady ? '✓ ORDEN LISTA' : `${items.filter(([_, i]) => i.estado).length}/${items.length} items listos`}
        </p>
      </div>

      {/* Notas */}
      {order.notas && (
        <div style={{ backgroundColor: '#ffebee', padding: '15px', borderRadius: '8px', marginBottom: '20px', borderLeft: '4px solid #d32f2f' }}>
          <p style={{ margin: '0', fontWeight: 'bold', color: '#d32f2f' }}>📝 Notas del Mesero:</p>
          <p style={{ margin: '5px 0 0 0' }}>{order.notas}</p>
        </div>
      )}

      {/* Items */}
      <div>
        <h3>Platos a Preparar</h3>
        {items.map(([itemId, item]) => (
          <div
            key={itemId}
            onClick={() => handleToggleItemReady(itemId, item.estado)}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '15px',
              marginBottom: '10px',
              backgroundColor: item.estado ? '#e8f5e9' : '#f5f5f5',
              border: item.estado ? '2px solid #4caf50' : '1px solid #ddd',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
          >
            <input
              type="checkbox"
              checked={item.estado}
              onChange={() => {}}
              style={{ width: '24px', height: '24px', cursor: 'pointer', marginRight: '15px' }}
            />
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 5px 0' }}>{item.nombre}</h4>
              <p style={{ margin: '0', color: '#666' }}>
                Cantidad: <strong>{item.cantidad}</strong>
              </p>
              {item.tiempoEstimado && (
                <p style={{ margin: '0', fontSize: '0.9em', color: '#999' }}>
                  ⏱ {item.tiempoEstimado} min aprox.
                </p>
              )}
            </div>
            <div style={{ fontSize: '2em', marginLeft: '15px' }}>
              {item.estado ? '✓' : '○'}
            </div>
          </div>
        ))}
      </div>

      {/* Acción Final */}
      {allItemsReady && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#c8e6c9', borderRadius: '8px', textAlign: 'center' }}>
          <p style={{ margin: '0', color: '#2e7d32', fontWeight: 'bold' }}>
            ✓ Orden lista para ser levantada por el mesero
          </p>
        </div>
      )}
    </div>
  )
}
```

### Componente: `CocineroDashboard.jsx`

Dashboard principal del cocinero.

```jsx
import React, { useState } from 'react'
import { useAuth } from '../../src/useAuth.jsx'
import OrderQueue from './components/OrderQueue.jsx'
import OrderDetail from './components/OrderDetail.jsx'
import './CocineroDashboard.css'

export default function CocineroDashboard() {
  const { user, logout } = useAuth()
  const [selectedOrderId, setSelectedOrderId] = useState(null)

  const handleLogout = async () => {
    await logout()
    window.location.href = '/'
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <header style={{ backgroundColor: '#ff6f00', color: 'white', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 5px 0' }}>🍳 Cocina - {user?.nombre}</h1>
          <p style={{ margin: '0', fontSize: '0.9em', opacity: 0.9 }}>Preparación de órdenes</p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: '10px 20px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Cerrar Sesión
        </button>
      </header>

      {/* Content */}
      <div style={{ padding: '20px' }}>
        {!selectedOrderId ? (
          <OrderQueue
            onSelectOrder={setSelectedOrderId}
            selectedOrderId={selectedOrderId}
          />
        ) : (
          <OrderDetail
            orderId={selectedOrderId}
            onBack={() => setSelectedOrderId(null)}
          />
        )}
      </div>
    </div>
  )
}
```

---

## 6) Funciones Helper

### Función: `calculateOrderProgress()`

Calcula el progreso de una orden.

```jsx
export function calculateOrderProgress(order) {
  if (!order.items) return 0

  const items = Object.values(order.items)
  if (items.length === 0) return 0

  const readyItems = items.filter(item => item.estado).length
  return Math.round((readyItems / items.length) * 100)
}
```

### Función: `estimateTotalTime()`

Estima el tiempo total de preparación.

```jsx
export function estimateTotalTime(order) {
  if (!order.items) return 0

  const items = Object.values(order.items)
  if (items.length === 0) return 0

  // El tiempo es el máximo entre todos los items (cocina en paralelo)
  return Math.max(...items.map(item => item.tiempoEstimado || 0))
}
```

### Función: `getOrderStatusColor()`

Retorna color según estado de orden.

```jsx
export function getOrderStatusColor(status) {
  const colors = {
    'Pendiente': '#f57c00',      // Naranja
    'En Preparacion': '#2196f3', // Azul
    'Lista': '#4caf50',          // Verde
    'Servida': '#9c27b0',        // Púrpura
    'Pagada': '#757575'          // Gris
  }
  return colors[status] || '#999'
}
```

### Función: `validateOrderBeforeMarkingReady()`

Valida que todos los items tengan los datos necesarios.

```jsx
export function validateOrderBeforeMarkingReady(order) {
  const errors = []

  if (!order || !order.items) {
    errors.push('Orden inválida')
    return { isValid: false, errors }
  }

  const items = Object.values(order.items)
  
  if (items.length === 0) {
    errors.push('La orden no tiene items')
  }

  const unreadyItems = items.filter(item => !item.estado)
  if (unreadyItems.length > 0) {
    errors.push(`Quedan ${unreadyItems.length} items sin marcar como listos`)
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}
```

---

## 7) Instrucciones de Integración

### Paso 1: Preparar la estructura de carpetas

Crea esta estructura en `interfaz-cocina/`:

```
interfaz-cocina/
├── components/
│   ├── OrderQueue.jsx
│   ├── OrderDetail.jsx
│   ├── NotificationSound.jsx
│   ├── TimerComponent.jsx
│   └── ProgressBar.jsx
├── utils/
│   ├── orderHelpers.js
│   └── timerHelpers.js
├── CocineroDashboard.jsx
├── CocineroDashboard.css
└── index.jsx
```

### Paso 2: Crear `CocineroDashboard.jsx`

(Ver componente arriba en sección 5)

### Paso 3: Actualizar `src/App.jsx`

Agregar ruta para Cocinero:

```jsx
import CocineroDashboard from '../interfaz-cocina/CocineroDashboard.jsx'

// En las rutas:
<Route 
  path="/cocinero" 
  element={
    <ProtectedRoute>
      <CocineroDashboard />
    </ProtectedRoute>
  } 
/>
```

### Paso 4: Actualizar función `getHomeRoute()`

```jsx
function getHomeRoute(role) {
  const routes = {
    'Admin': '/admin',
    'Mesero': '/mesero',
    'Cosinero': '/cocinero',
    'Cajero': '/cajero'
  }
  return routes[role] || '/'
}
```

### Paso 5: Copiar Reglas a Firebase Console

1. Ve a Firebase Console → Tu proyecto → Realtime Database → Rules
2. Reemplaza el contenido con las reglas de la sección 3
3. Haz clic en "Publish"

---

## 8) Consideraciones de Seguridad

1. **Validación de Rol**: Las reglas permiten que solo Cosineros cambien estado de items
2. **Auditoría**: Cada cambio tiene `fechaInicio` y `fechaFin` para trazabilidad
3. **Asignación de Órdenes**: Un Cosinero toma una orden completa (evita conflictos)
4. **Cambios Irreversibles**: Una vez marcado como listo, validar antes de permitir desmarcar
5. **Notas Importantes**: El Mesero puede dejar notas especiales que el Cosinero debe ver destacadas
6. **Coordinación**: Si falta stock de un item, el Cosinero debe notificar al Admin

---

## 9) Checklist de Aceptación

- [ ] El Cocinero ve cola de órdenes pendientes en tiempo real
- [ ] El Cocinero puede tomar una orden (asignarla a sí mismo)
- [ ] El Cocinero ve detalle completo: items, cantidad, notas especiales
- [ ] El Cocinero puede marcar items como listos (uno por uno)
- [ ] La interfaz muestra progreso de la orden (x/y items listos)
- [ ] Cuando todos los items están listos, la orden cambia a "Lista"
- [ ] Las notas del Mesero se destacan visualmente
- [ ] El Cocinero puede ver órdenes de otros cocineros (para coordinar)
- [ ] Las órdenes se actualizan en tiempo real (sin necesidad de refrescar)
- [ ] Solo Cosineros pueden cambiar estado de items (validación de rol)
- [ ] El tiempo estimado se muestra en cada item
- [ ] Las órdenes están ordenadas por antigüedad (FIFO)
- [ ] El Mesero ve inmediatamente cuando orden está "Lista"
- [ ] Puede marcar nuevamente como "no listo" si hay error (con restricción)

---

## 10) Pasos Siguientes

1. **Implementar componentes** en `interfaz-cocina/components/`
2. **Crear utils** (orderHelpers.js, timerHelpers.js)
3. **Agregar sonidos** de notificación cuando hay orden nueva
4. **Agregar timers** por item para alertar si está tardando mucho
5. **Publicar reglas** en Firebase Console
6. **Probar flujo completo**: Mesero crea orden → aparece en Cocina → marca items → orden lista
7. **Implementar pantalla de cocina** grande (para ver múltiples órdenes)
8. **Integrar impresora** de tickets (para imprimir nuevas órdenes)

---

**¡Tu equipo está listo para implementar la interfaz del Cocinero!** 🎉

La interfaz es real-time, lo que permite que todos los Cocineros vean cambios instantáneamente y coordinen sin conflictos.
