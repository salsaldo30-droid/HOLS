# 📋 Estructura del Proyecto - Guía para el Equipo

Este documento describe la estructura recomendada para cada carpeta de rol para evitar conflictos al integrar el código.

---

## 🎯 Convenciones Importantes

### ✅ DO's (Hacer)
- Crear archivos en tu carpeta de rol específica
- Usar nombres de componentes descriptivos
- Importar desde `../../config/firebase.init.js` y `../../src/useAuth.jsx`
- Crear componentes como funciones con `export default`
- Usar CSS files separados (`NombreComponente.css`)

### ❌ DON'Ts (No hacer)
- No editar archivos de otra interfaz de rol
- No modificar `/src/`, `/config/` a menos que sea consensuado
- No usar nombres genéricos (`Component1.jsx`, `Helper.js`)
- No crear componentes en la raíz, usar subdirectorios
- No hacer imports circulares entre roles

---

## 📁 Estructura Recomendada por Rol

### Admin
```
interfaz-admin/
├── components/
│   ├── UserManagement.jsx       (Gestión de usuarios)
│   ├── MenuManager.jsx          (Gestión de menú)
│   ├── TableManager.jsx         (Gestión de mesas)
│   ├── ReportsAnalytics.jsx     (Reportes)
│   └── UserManagement.css
├── utils/
│   ├── adminHelpers.js          (Funciones helper)
│   └── validators.js             (Validaciones)
├── AdminDashboard.jsx           (Dashboard principal)
├── AdminDashboard.css
└── index.jsx                    (Entry point, si es módulo independiente)
```

### Mesero
```
interfaz-mesero/
├── components/
│   ├── TablesGrid.jsx           (Grid de mesas)
│   ├── OrderModal.jsx           (Modal para crear orden)
│   ├── MenuSelector.jsx         (Selector de items)
│   ├── OrdersList.jsx           (Lista de órdenes)
│   ├── OrderDetail.jsx          (Detalle de orden)
│   └── TablesGrid.css
├── utils/
│   ├── orderHelpers.js          (Crear orden, etc)
│   └── validators.js
├── MeseroDashboard.jsx          (Dashboard principal)
├── MeseroDashboard.css
└── index.jsx
```

### Cocinero ⭐ (NUEVA)
```
interfaz-cocina/
├── components/
│   ├── OrderQueue.jsx           (Cola de órdenes)
│   ├── OrderDetail.jsx          (Detalle de orden para preparar)
│   ├── ProgressBar.jsx          (Barra de progreso)
│   ├── NotificationSound.jsx    (Notificaciones sonoras)
│   ├── TimerComponent.jsx       (Timer por item)
│   └── OrderQueue.css
├── utils/
│   ├── orderHelpers.js          (Cálculos de progreso)
│   ├── timerHelpers.js          (Lógica de timers)
│   └── soundHelpers.js          (Reproducir sonidos)
├── CocineroDashboard.jsx        (Dashboard principal)
├── CocineroDashboard.css
└── index.jsx
```

### Cajero ⭐ (NUEVA)
```
interfaz-cajero/
├── components/
│   ├── PendingOrdersList.jsx    (Órdenes por cobrar)
│   ├── PaymentProcessor.jsx     (Procesar pago)
│   ├── ReceiptPrinter.jsx       (Imprimir recibo)
│   ├── DailyReportDashboard.jsx (Reporte diario)
│   ├── PaymentMethodSelector.jsx (Seleccionar método)
│   └── PendingOrdersList.css
├── utils/
│   ├── paymentHelpers.js        (Calcular montos, generar recibo)
│   ├── reportHelpers.js         (Agregación de reportes)
│   └── validators.js            (Validar pagos)
├── CajeroDashboard.jsx          (Dashboard principal)
├── CajeroDashboard.css
└── index.jsx
```

---

## 🚀 Paso a Paso para Crear tu Interfaz

### Paso 1: Crear la Carpeta de Componentes

```bash
# Para Cocinero:
mkdir interfaz-cocina/components
mkdir interfaz-cocina/utils

# Para Cajero:
mkdir interfaz-cajero/components
mkdir interfaz-cajero/utils
```

✅ **Ya hecho en este proyecto**

### Paso 2: Crear el Dashboard Principal

Ejemplo para **Cajero** (`interfaz-cajero/CajeroDashboard.jsx`):

```jsx
import React, { useState } from 'react'
import { useAuth } from '../../src/useAuth.jsx'
import PendingOrdersList from './components/PendingOrdersList.jsx'
import PaymentProcessor from './components/PaymentProcessor.jsx'
import DailyReportDashboard from './components/DailyReportDashboard.jsx'
import './CajeroDashboard.css'

export default function CajeroDashboard() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('pending')
  const [selectedOrderId, setSelectedOrderId] = useState(null)

  const handleLogout = async () => {
    await logout()
    window.location.href = '/'
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <header style={{ backgroundColor: '#1976d2', color: 'white', padding: '20px' }}>
        <h1>💳 Caja - {user?.nombre}</h1>
        <button onClick={handleLogout}>Cerrar Sesión</button>
      </header>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid #ddd', padding: '0 20px' }}>
        <button onClick={() => setActiveTab('pending')}>Pagos Pendientes</button>
        <button onClick={() => setActiveTab('reports')}>Reportes Diarios</button>
      </div>

      {/* Content */}
      <div style={{ padding: '20px' }}>
        {activeTab === 'pending' && !selectedOrderId && (
          <PendingOrdersList onSelectOrder={setSelectedOrderId} />
        )}
        {activeTab === 'pending' && selectedOrderId && (
          <PaymentProcessor
            orderId={selectedOrderId}
            onPaymentComplete={() => setSelectedOrderId(null)}
          />
        )}
        {activeTab === 'reports' && (
          <DailyReportDashboard />
        )}
      </div>
    </div>
  )
}
```

### Paso 3: Crear Componentes en `components/`

Cada componente debe:
- Tener archivo `.jsx` y `.css` correspondiente
- Usar `export default function NombreComponente()`
- Importar `{ useAuth }` si necesita usuario actual
- Importar `{ db }` de firebase si necesita datos
- Tener proptypes comentados

Ejemplo: `interfaz-cajero/components/PendingOrdersList.jsx`

```jsx
import React, { useEffect, useState } from 'react'
import { db } from '../../config/firebase.init.js'
import { ref, onValue } from 'firebase/database'
import './PendingOrdersList.css'

/**
 * Componente PendingOrdersList
 * 
 * Props:
 *   onSelectOrder (function) - Callback cuando selecciona orden
 * 
 * State:
 *   orders (array) - Órdenes con estado "Servida"
 *   loading (bool) - Cargando datos
 */
export default function PendingOrdersList({ onSelectOrder }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onValue(ref(db, 'ordenes'), (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const pending = Object.entries(data)
          .filter(([_, order]) => order.estado === 'Servida')
          .map(([id, order]) => ({ id, ...order }))
        setOrders(pending)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (loading) return <div>Cargando...</div>

  return (
    <div>
      <h2>Órdenes Pendientes</h2>
      {orders.map((order) => (
        <div key={order.id} onClick={() => onSelectOrder(order.id)}>
          Mesa {order.numero} - S/ {order.total}
        </div>
      ))}
    </div>
  )
}
```

### Paso 4: Crear Funciones Helper en `utils/`

Archivo: `interfaz-cajero/utils/paymentHelpers.js`

```javascript
/**
 * Calcular monto final con descuento y propina
 * @param {number} baseAmount - Monto base
 * @param {number} discount - Descuento
 * @param {number} tip - Propina
 * @returns {number} Monto final
 */
export function calculateFinalAmount(baseAmount, discount = 0, tip = 0) {
  return baseAmount - Math.max(0, discount) + Math.max(0, tip)
}

/**
 * Generar número de recibo único
 * @param {string} userId - UID del usuario
 * @returns {string} Número de recibo
 */
export function generateReceiptNumber(userId) {
  const timestamp = new Date()
  const date = `${timestamp.getFullYear()}${String(timestamp.getMonth() + 1).padStart(2, '0')}${String(timestamp.getDate()).padStart(2, '0')}`
  const random = Math.floor(Math.random() * 10000)
  return `RCP-${String(userId).slice(0, 6)}-${date}-${String(random).padStart(4, '0')}`
}

/**
 * Validar datos de pago
 * @param {object} paymentData - Datos del pago
 * @returns {object} { isValid, errors }
 */
export function validatePaymentData(paymentData) {
  const errors = []

  if (!paymentData.orderId) errors.push('Orden requerida')
  if (!paymentData.amount || paymentData.amount <= 0) errors.push('Monto inválido')
  if (!paymentData.method) errors.push('Método de pago requerido')

  return {
    isValid: errors.length === 0,
    errors
  }
}
```

### Paso 5: Crear Estilos CSS

Archivo: `interfaz-cajero/CajeroDashboard.css`

```css
.cajero-dashboard {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.cajero-header {
  background-color: #1976d2;
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cajero-header h1 {
  margin: 0;
  font-size: 1.8em;
}

.cajero-tabs {
  background-color: white;
  border-bottom: 1px solid #ddd;
  display: flex;
  padding: 0 20px;
}

.cajero-tabs button {
  padding: 15px 20px;
  border: none;
  background-color: transparent;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.3s;
}

.cajero-tabs button.active {
  border-bottom-color: #1976d2;
  color: #1976d2;
  font-weight: bold;
}

.cajero-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}
```

### Paso 6: Crear `index.jsx` (si es módulo independiente)

Archivo: `interfaz-cajero/index.jsx`

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import CajeroDashboard from './CajeroDashboard.jsx'
import './CajeroDashboard.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CajeroDashboard />
  </React.StrictMode>
)
```

---

## 🔗 Importaciones Estándar

### De Firebase (Siempre desde `config/`)
```jsx
import { db } from '../../config/firebase.init.js'
import { auth } from '../../config/firebase.init.js'
```

### De Autenticación
```jsx
import { useAuth } from '../../src/useAuth.jsx'

// En componente:
const { user, loading, logout } = useAuth()
```

### De Firebase SDK (Realtime Database)
```jsx
import { ref, onValue, get, update, set, push } from 'firebase/database'
```

### Ejemplo Completo
```jsx
import React, { useEffect, useState } from 'react'
import { db } from '../../config/firebase.init.js'
import { ref, onValue } from 'firebase/database'
import { useAuth } from '../../src/useAuth.jsx'
import './MyComponent.css'

export default function MyComponent() {
  const { user } = useAuth()
  const [data, setData] = useState([])

  useEffect(() => {
    const unsubscribe = onValue(ref(db, 'ruta/datos'), (snapshot) => {
      setData(snapshot.val())
    })
    return () => unsubscribe()
  }, [])

  return <div>Contenido</div>
}
```

---

## ⚠️ Evitar Conflictos de Merge

### Durante Desarrollo
1. **Trabaja en tu carpeta de rol**
2. **No edites archivos centrales** (`src/`, `config/`)
3. **Coordina cambios globales** con el equipo
4. **Usa git branches** por rol:
   ```bash
   git checkout -b cajero/payment-processor
   git checkout -b cocina/order-queue
   ```

### Antes de Merge
1. **Actualiza desde main:** `git pull origin main`
2. **Resuelve conflictos** si los hay
3. **Test local:** `npm run dev`
4. **Haz PR** con descripción clara

### Cambios que Requieren Coordinación
- Modificar `src/App.jsx` (routing)
- Modificar `src/useAuth.jsx` (auth)
- Agregar dependencias (`package.json`)
- Cambiar reglas Firebase

---

## 📝 Checklist Antes de Compartir

- [ ] Componentes en `components/` con CSS separado
- [ ] Funciones helper en `utils/`
- [ ] Dashboard principal (`CajeroDashboard.jsx`, `CocineroDashboard.jsx`)
- [ ] Importaciones correctas (desde `../../`)
- [ ] Sin hardcoding de datos
- [ ] Sin consoles.log en código final
- [ ] Estilos definidos en CSS o inline style
- [ ] Componentes exportados con `export default`

---

## 🎉 ¡Listo!

Tu estructura está lista. Ahora:

1. **Lee tu documento de integración** (`docs/CAJERO_INTEGRATION.md` o `COCINERO_INTEGRATION.md`)
2. **Copia los componentes**
3. **Adapta según necesidad**
4. **Prueba localmente**
5. **Haz commit y PR**

---

**Éxito con tu implementación!** 🚀

*Estructura recomendada - Noviembre 2025*
