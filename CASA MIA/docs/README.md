# 📚 Documentación de Integración - CASA MIA

Bienvenido al sistema de gestión del restaurante CASA MIA. Este directorio contiene guías completas para implementar cada interfaz de rol.

---

## 📖 Documentación Disponible

### 1. **ADMIN_INTEGRATION.md** 👨‍💼
**Para el equipo Admin/Manager**

Responsabilidades:
- Gestionar usuarios y asignar roles
- Administrar menú de restaurante
- Gestionar mesas y reservas
- Ver reportes y analytics
- Configurar sistema

**Contenido:**
- Modelo de datos
- Reglas de seguridad (Firebase)
- Cloud Function example (`assignRole`)
- Componentes React recomendados
- Instrucciones paso a paso

**Ruta en app:** `/admin`

---

### 2. **MESERO_INTEGRATION.md** 🧑‍🍳
**Para el equipo de Meseros**

Responsabilidades:
- Crear órdenes
- Gestionar mesas
- Entregar órdenes a cocina
- Servir al cliente
- Coordinar con cocinero y cajero

**Contenido:**
- Responsabilidades detalladas
- Modelo de datos para órdenes
- Reglas de seguridad
- Componentes React (TablesGrid, OrderModal, etc.)
- Función helper `createOrder()`
- Flujo de creación de orden

**Ruta en app:** `/mesero`

---

### 3. **COCINERO_INTEGRATION.md** 🍳
**Para el equipo de Cocineros**

Responsabilidades:
- Recibir órdenes en tiempo real
- Preparar platos
- Marcar items como listos
- Coordinar múltiples órdenes
- Gestionar tiempos de preparación

**Contenido:**
- Responsabilidades detalladas
- Modelo de datos para preparación
- Reglas de seguridad
- Componentes React (OrderQueue, OrderDetail, etc.)
- Funciones helper para progreso y tiempos
- Flujo de preparación

**Ruta en app:** `/cocinero`

---

### 4. **CAJERO_INTEGRATION.md** 💳
**Para el equipo de Cajeros**

Responsabilidades:
- Procesar pagos
- Generar recibos
- Gestionar métodos de pago
- Registrar transacciones
- Generar reportes diarios

**Contenido:**
- Responsabilidades detalladas
- Modelo de datos para pagos
- Reglas de seguridad
- Componentes React (PendingOrdersList, PaymentProcessor, DailyReportDashboard)
- Funciones helper para pagos
- Flujo de procesamiento de pago

**Ruta en app:** `/cajero`

---

## 🔧 Cómo Usar Esta Documentación

### Para Desarrolladores Frontend:

1. **Selecciona tu rol** en la lista arriba
2. **Lee la sección de Responsabilidades** para entender el flujo
3. **Revisa el Modelo de Datos** (Realtime Database)
4. **Copia los Componentes React** de la sección 5 o 6
5. **Implementa las funciones helper**
6. **Sigue las instrucciones de integración** (paso a paso)
7. **Usa el checklist de aceptación** para validar completitud

### Para Administradores Firebase:

1. **Copiar las Reglas** de la sección 3
2. **Ir a Firebase Console → Realtime Database → Rules**
3. **Pegar el contenido JSON**
4. **Hacer clic en "Publish"**

### Para DevOps / Cloud Functions:

1. **Ver ejemplo de Cloud Function** en ADMIN_INTEGRATION.md
2. **Adaptar a necesidades específicas**
3. **Deployar con Firebase CLI:** `firebase deploy --only functions`

---

## 📁 Estructura del Proyecto

```
TRABAJO restaurante/CASA MIA/
├── config/
│   ├── firebaseConfig.js       (Configuración de Firebase)
│   └── firebase.init.js        (Inicialización de servicios)
├── src/
│   ├── useAuth.jsx             (Hook de autenticación)
│   ├── LoginRegister.jsx       (Formulario de login)
│   ├── App.jsx                 (Router principal)
│   └── ProtectedRoute.jsx      (Guardia de rutas)
├── interfaz-admin/
│   └── AdminDashboard.jsx      (Dashboard Admin)
├── interfaz-mesero/
│   └── MeseroDashboard.jsx     (Dashboard Mesero)
├── interfaz-cocina/
│   └── CocineroDashboard.jsx   (Dashboard Cocinero)
├── interfaz-cajero/
│   └── CajeroDashboard.jsx     (Dashboard Cajero)
└── docs/
    ├── README.md               (Este archivo)
    ├── ADMIN_INTEGRATION.md
    ├── MESERO_INTEGRATION.md
    ├── COCINERO_INTEGRATION.md
    └── CAJERO_INTEGRATION.md
```

---

## 🚀 Instalación Rápida

### 1. Clonar proyecto y instalar dependencias:

```bash
npm install
```

### 2. Configurar Firebase:

- Actualizar `config/firebaseConfig.js` con credenciales de tu proyecto
- O dejar como está si ya está configurado

### 3. Iniciar servidor de desarrollo:

```bash
npm run dev
```

- App disponible en: `http://localhost:5179` (o puerto que te indique)

### 4. Crear usuario de prueba:

1. Ir a `http://localhost:5179`
2. Hacer clic en "Registrarse"
3. Ingresar email y contraseña
4. En Firebase Console → Authentication → seleccionar usuario
5. Ir a Firebase Console → Realtime Database → `usuarios/{uid}`
6. **Cambiar `rol` a uno de:**
   - `Admin`
   - `Mesero`
   - `Cosinero`
   - `Cajero`

7. Refrescar página y debería redirigirse al dashboard del rol

---

## 🔐 Seguridad

### Autenticación:
- Firebase Authentication (Email/Password)
- JWT tokens almacenados en localStorage
- Session persistence automático

### Base de datos:
- Realtime Database con reglas de seguridad por rol
- Cada rol solo puede leer/escribir datos específicos
- Validación de rol en cliente y servidor

### Best Practices:
- **No guardar contraseñas** en código
- **Usar variables de entorno** para credenciales
- **Validar datos** en servidor (Cloud Functions)
- **Nunca confiar** solo en validaciones del cliente

---

## 📞 Flujo Completo (Ejemplo)

```
1. MESERO: Abre mesa, crea orden
   └─ Sistema: Orden creada con estado "Pendiente"

2. COCINERO: Ve orden en cola, la toma
   └─ Sistema: Orden asignada, estado "En Preparacion"

3. COCINERO: Marca items como listos
   └─ Sistema: Cuando todos listos, estado "Lista"

4. MESERO: Ve orden lista, la levanta
   └─ Sistema: Estado "Servida"

5. CAJERO: Procesa pago
   └─ Sistema: Crea /pagos/{id}, orden estado "Pagada", mesa "Disponible"

6. ADMIN: Ve reporte de venta
   └─ Sistema: Datos agregados en /reporteDiario/{fecha}
```

---

## ✅ Checklist antes de Producción

- [ ] Todas las reglas de Realtime Database publicadas
- [ ] Variables de entorno configuradas
- [ ] Cloud Functions desplegadas (`assignRole`, etc.)
- [ ] Usuarios de prueba creados con todos los roles
- [ ] Flujo completo probado (orden → pago)
- [ ] Estilos CSS aplicados
- [ ] Impresora de recibos configurada (si aplica)
- [ ] Backups de Firebase habilitados
- [ ] Monitoreo de errors configurado
- [ ] Documentación compartida con equipo

---

## 📚 Recursos Adicionales

- **Firebase Docs:** https://firebase.google.com/docs
- **React Router:** https://reactrouter.com/
- **Realtime Database Rules:** https://firebase.google.com/docs/rules/basics

---

## 🤝 Soporte

Si tienes dudas sobre:

1. **Autenticación** → Ver `src/useAuth.jsx`
2. **Rutas** → Ver `src/App.jsx`
3. **Componentes** → Ver documentación específica de tu rol
4. **Base de datos** → Ver sección "Modelo de datos" en tu documento

---

**¡Éxito con la implementación del sistema CASA MIA!** 🎉

*Última actualización: Noviembre 2025*
