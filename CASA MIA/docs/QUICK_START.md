# 🚀 Guía de Inicio Rápido

Esta guía te ayudará a empezar a trabajar con el sistema CASA MIA en 15 minutos.

---

## ⚡ 5 Pasos para Empezar

### Paso 1: Clonar/Descargar Proyecto

```bash
# Si usas Git:
git clone <url-repo>
cd "TRABAJO restaurante/CASA MIA"

# O descargar ZIP
```

### Paso 2: Instalar Dependencias

```bash
npm install
```

Esto instalará:
- React
- React Router
- Firebase SDK
- Vite

### Paso 3: Configurar Firebase (si no está hecho)

**Opción A: Si tienes credenciales Firebase**

Editar `config/firebaseConfig.js`:

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

**Opción B: Usar credenciales de prueba (ya configuradas)**

Las credenciales actuales funcionan con proyecto "ecogestorresiduos".

### Paso 4: Iniciar Servidor de Desarrollo

```bash
npm run dev
```

La app se abrirá en `http://localhost:5179`

### Paso 5: Crear Usuario de Prueba

1. **En la app:**
   - Haz clic en "Registrarse"
   - Email: `admin@test.com`
   - Password: `123456`

2. **En Firebase Console:**
   - Ve a https://console.firebase.google.com
   - Selecciona proyecto
   - Authentication → Verifica que el usuario existe
   - Realtime Database → `usuarios/[uid]` debe tener los datos

3. **Asignar Rol:**
   - Ve a: `https://console.firebase.google.com` → Realtime Database
   - Abre el nodo: `usuarios/[uid]`
   - Edita el campo `rol` a: `"Admin"` (entre comillas)
   - Click en ✓

4. **Refrescar App:**
   - Vuelve a `http://localhost:5179`
   - Deberías ver el Dashboard Admin

---

## 🎯 Entender la Estructura

### Autenticación

```
Usuario ingresa email/password
              ↓
     Firebase Auth valida
              ↓
    Crea sesión + JWT
              ↓
   Recupera datos de /usuarios/{uid}
              ↓
   Guarda en localStorage
              ↓
   App redirige según rol
```

**Archivo clave:** `src/useAuth.jsx`

### Routing

```
Login → useAuth() → role → getHomeRoute(role) → Dashboard
                                    ↓
                        Admin → /admin
                        Mesero → /mesero
                        Cosinero → /cocinero
                        Cajero → /cajero
```

**Archivo clave:** `src/App.jsx`

### Datos

```
React Component
        ↓
   (onValue listener)
        ↓
Firebase Realtime Database
        ↓
   (actualización en tiempo real)
        ↓
   Component re-render
```

**Archivo clave:** Cualquier componente que use `ref(db, 'path')` + `onValue()`

---

## 📚 Selecciona tu Rol

Una vez entiendas la estructura general, elige tu rol:

### 👨‍💼 Si eres del equipo ADMIN:
1. Lee: `docs/ADMIN_INTEGRATION.md`
2. Crea carpeta: `interfaz-admin/`
3. Copia componentes de la documentación
4. Implementa: Gestión de usuarios, menú, mesas

### 🧑‍🍳 Si eres del equipo MESERO:
1. Lee: `docs/MESERO_INTEGRATION.md`
2. Crea carpeta: `interfaz-mesero/` (ya existe)
3. Copia componentes de la documentación
4. Implementa: TablesGrid, OrderModal, OrdersList

### 👨‍🍳 Si eres del equipo COCINERO:
1. Lee: `docs/COCINERO_INTEGRATION.md`
2. Crea carpeta: `interfaz-cocina/`
3. Copia componentes de la documentación
4. Implementa: OrderQueue, OrderDetail, ProgressBar

### 💳 Si eres del equipo CAJERO:
1. Lee: `docs/CAJERO_INTEGRATION.md`
2. Crea carpeta: `interfaz-cajero/`
3. Copia componentes de la documentación
4. Implementa: PendingOrdersList, PaymentProcessor, DailyReportDashboard

---

## 🔍 Archivos Importantes

### Configuración
- `config/firebaseConfig.js` - Credenciales Firebase
- `config/firebase.init.js` - Inicialización de servicios
- `vite.config.js` - Configuración Vite
- `package.json` - Dependencias

### Autenticación & Routing
- `src/useAuth.jsx` - Context hook para auth
- `src/App.jsx` - Router principal
- `src/ProtectedRoute.jsx` - Validación de acceso
- `src/LoginRegister.jsx` - Formulario de login

### Componentes Base
- `interfaz-admin/AdminDashboard.jsx`
- `interfaz-mesero/MeseroDashboard.jsx`
- `interfaz-cocina/CocineroDashboard.jsx` (por crear)
- `interfaz-cajero/CajeroDashboard.jsx` (por crear)

### Documentación
- `docs/README.md` - Índice de docs
- `docs/ARCHITECTURE.md` - Diagrama completo
- `docs/ADMIN_INTEGRATION.md`
- `docs/MESERO_INTEGRATION.md`
- `docs/COCINERO_INTEGRATION.md`
- `docs/CAJERO_INTEGRATION.md`

---

## 💡 Tips para Developers

### Debugging

**Ver datos en tiempo real:**
```javascript
// En cualquier componente:
useEffect(() => {
  const ref = ref(db, 'usuarios')
  const unsubscribe = onValue(ref, (snapshot) => {
    console.log('Datos actuales:', snapshot.val())
  })
  return () => unsubscribe()
}, [])
```

**Verificar usuario autenticado:**
```javascript
const { user } = useAuth()
console.log('Usuario:', user)
console.log('Rol:', user?.rol)
```

**Probar con diferentes roles:**
1. Crea varios usuarios en Firebase Auth
2. Asigna roles diferentes en Realtime Database
3. Prueba cada interfaz

### Performance

- Usa `onValue()` con unsubscribe en cleanup
- No hagas listeners dentro de loops
- Limpia listeners cuando componente unmount
- Usa `update()` en lugar de `set()` para cambios parciales

### Errores Comunes

**"Cannot read property 'rol' of undefined"**
- Problema: Usuario no tiene datos en `/usuarios/{uid}`
- Solución: Crea el documento en Firebase o espera a que se cargue

**"Access denied" en Realtime Database**
- Problema: Las reglas no están publicadas
- Solución: Ve a Firebase Console → Rules → Publish

**"Module not found"**
- Problema: Ruta de importación incorrecta
- Solución: Usa rutas relativas: `../config/firebase.init.js`

---

## 🧪 Testing Rápido

### Test 1: Autenticación

```bash
1. npm run dev
2. Registrarse con email/password
3. Verificar en Firebase Auth Console
4. Verificar en Realtime Database /usuarios/{uid}
```

**Esperado:** Usuario aparece en ambos lugares ✓

### Test 2: Rol-Based Access

```bash
1. Cambiar rol a "Admin" en Firebase Console
2. Refrescar app
3. Debería ver /admin dashboard
4. Cambiar rol a "Mesero"
5. Refrescar app
6. Debería ver /mesero dashboard
```

**Esperado:** Redirige correctamente según rol ✓

### Test 3: Real-time Update

```bash
1. Admin: Crea un nuevo usuario en Firebase Console
2. Mesero: Sin refrescar, debería ver el cambio
3. Cocinero: Sin refrescar, debería ver órdenes nuevas
4. Cajero: Sin refrescar, debería ver pagos procesados
```

**Esperado:** Cambios sincronizados instantáneamente ✓

---

## 📖 Ejemplos de Código Rápidos

### Leer datos una sola vez

```jsx
import { ref, get } from 'firebase/database'

const getOrderData = async (orderId) => {
  const snapshot = await get(ref(db, `ordenes/${orderId}`))
  return snapshot.val()
}
```

### Escuchar cambios en tiempo real

```jsx
import { ref, onValue } from 'firebase/database'

useEffect(() => {
  const unsubscribe = onValue(ref(db, 'ordenes'), (snapshot) => {
    setOrders(snapshot.val())
  })
  return () => unsubscribe()
}, [])
```

### Actualizar datos

```jsx
import { ref, update } from 'firebase/database'

const updateOrderStatus = async (orderId, newStatus) => {
  await update(ref(db, `ordenes/${orderId}`), {
    estado: newStatus
  })
}
```

### Crear documento

```jsx
import { ref, push, set } from 'firebase/database'

const createPago = async (paymentData) => {
  const newPaymentRef = push(ref(db, 'pagos'))
  await set(newPaymentRef, paymentData)
  return newPaymentRef.key // ID del nuevo documento
}
```

---

## 🎨 Agregando Estilos

### Opción 1: Inline Styles (Rápido)

```jsx
<div style={{ padding: '20px', backgroundColor: '#f5f5f5' }}>
  Contenido
</div>
```

### Opción 2: CSS Files (Recomendado)

Crear `CajeroDashboard.css`:
```css
.cajero-dashboard {
  padding: 20px;
  background-color: #f5f5f5;
}

.order-card {
  border: 1px solid #ddd;
  padding: 15px;
  border-radius: 8px;
}
```

Usar en componente:
```jsx
import './CajeroDashboard.css'

export default function CajeroDashboard() {
  return <div className="cajero-dashboard">...</div>
}
```

### Opción 3: Librerías CSS (Profesional)

```bash
npm install tailwindcss
```

---

## 🔐 Publicar Reglas Firebase

Una vez que termines tu módulo, publica las reglas:

1. **Ve a Firebase Console**
   - https://console.firebase.google.com
   - Proyecto → Realtime Database → Rules

2. **Copia las reglas** de tu documento de integración

3. **Pega el JSON** en el editor

4. **Haz clic en "Publish"**

**Ejemplo mínimo de reglas:**
```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

---

## 📞 Flujo de Trabajo Recomendado

### Día 1: Entender
- [ ] Lee la arquitectura completa
- [ ] Lee tu documento específico de rol
- [ ] Entiende el flujo de datos

### Día 2: Copiar
- [ ] Copia los componentes React
- [ ] Copia las funciones helper
- [ ] Adapta a tu proyecto

### Día 3: Implementar
- [ ] Crea la carpeta de tu rol
- [ ] Implementa los componentes
- [ ] Agrega estilos

### Día 4: Testear
- [ ] Test local: `npm run dev`
- [ ] Test de roles: cambia usuario
- [ ] Test real-time: abre en 2 pestaña

### Día 5: Publicar
- [ ] Publica reglas Firebase
- [ ] Deploy a hosting (opcional)
- [ ] Documentar cambios

---

## ❓ Preguntas Frecuentes

### P: ¿Por qué no veo los datos en la app?
**R:** Verificar:
1. ¿Datos existen en Firebase?
2. ¿Las reglas permiten lectura?
3. ¿El listener está activo?

### P: ¿Cómo cambio el rol de un usuario?
**R:** 
1. Firebase Console → Realtime Database
2. Navega a `usuarios/{uid}`
3. Edita el campo `rol`
4. Refrescar app

### P: ¿Qué pasa si pierdo la conexión?
**R:** 
- Firebase mantiene datos en caché
- Cuando vuelve conexión, sincroniza
- El usuario sigue logueado (JWT en localStorage)

### P: ¿Puedo usar esto en móvil?
**R:** Sí, la misma URL funciona. Para app nativa:
- Usar React Native
- Firebase SDK para React Native
- Mismo código de lógica

### P: ¿Cómo imprimo un recibo?
**R:** Instala librería de impresión:
```bash
npm install react-to-print
```
Luego usa en componente de recibo.

---

## 🎓 Próximos Pasos

1. **Elige tu rol** y lee tu documento
2. **Copia los componentes** y adapta
3. **Prueba localmente** con `npm run dev`
4. **Publica las reglas** en Firebase
5. **Deploy a hosting** cuando esté listo

---

## 📞 Contacto / Soporte

- **Documentación:** Ver carpeta `docs/`
- **Código:** Ver archivos en raíz del proyecto
- **Firebase:** https://console.firebase.google.com
- **React:** https://react.dev/

---

**¡Listo para empezar! 🚀**

Tienes todo lo que necesitas. La próxima sección es específica de tu rol.

*Última actualización: Noviembre 2025*
