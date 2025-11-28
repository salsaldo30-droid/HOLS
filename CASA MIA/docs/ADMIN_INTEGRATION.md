# Integración — Interfaz y funciones del Administrador

Este documento contiene todo lo que el equipo necesita para crear la interfaz y las funciones del administrador usando Firebase Authentication y Realtime Database.

Resumen rápido:
- Autenticación: Firebase Auth (Email/Password)
- Datos: Realtime Database (estructura y reglas abajo)
- Asignación de roles segura: Cloud Function (Admin SDK) que escribe `/usuarios/{uid}` y `setCustomUserClaims`
- Frontend: React + Firebase client SDK (ya tenemos `config/firebase.init.js` exportando `auth` y `db`)

---

## 1) Modelo de datos (Realtime Database)
Se representará cada "colección" como una rama en Realtime Database. Los nombres son los que usaremos en el frontend/back-end.

/usuarios/{uid}
- nombre: string
- email: string
- rol: "Admin" | "Cosinero" | "Mesero" | "Cajero"

/menuItems/{menu_item_id}
- nombre: string
- descripcion: string
- precio: number
- categoria: string
- disponible: boolean
- stock: number

/mesas/{mesa_id}
- numero: number
- capacidad: number
- estado: "Disponible" | "Ocupada" | "Reservada"

/ordenes/{orden_id}
- idMesa: {mesa_id}
- idMesero: {uid}
- estado: "Pendiente" | "En Preparacion" | "Lista" | "Servida" | "Pagada"
- fechaCreacion: timestamp
- total: number
- notas: string
- items/{item_id}
  - idMenuItem
  - nombre
  - cantidad
  - precioUnitario
  - estado: boolean (por ejemplo: preparado?)

/reservas/{reserva_id}
- nombreCliente: string
- telefonoCliente: string
- fechaHora: timestamp
- numeroPersonas: number
- idMesaAsignada: {mesa_id} (opcional)
- estado: string (ej. "Confirmada")

---

## 2) Reglas de Realtime Database (ejemplo para desarrollo)
Pegar en Firebase Console → Realtime Database → Rules. Estas reglas asumen que el rol oficial del usuario se encuentra en las claims del token (`auth.token.role`) y no en el contenido que el cliente pueda escribir.

> IMPORTANTE: Para producción ajustar las reglas según seguridad y flujos de negocio.

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
      ".write": "auth != null && (auth.token.role == 'Admin' || auth.token.role == 'Cosinero')"
    },
    "mesas": {
      ".read": true,
      ".write": "auth != null && auth.token.role == 'Admin'"
    },
    "ordenes": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "reservas": {
      ".read": true,
      ".write": "auth != null"
    }
  }
}
```

Notas:
- `auth.token.role` es una custom claim que solo puede establecerse mediante Admin SDK en backend/Cloud Functions.
- No confiar en `rol` escrito por el cliente en `/usuarios/{uid}` para la autorización crítica.

---

## 3) Cloud Function: `assignRole` (ejemplo)
Función callable que solo puede ejecutar un Admin y que asigna role a un usuario (setCustomUserClaims) y escribe el perfil en Realtime DB.

`functions/index.js` (Node 18, Firebase Functions):

```js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.assignRole = functions.https.onCall(async (data, context) => {
  // Verificar autenticación
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Not authenticated');
  }

  // Solo Admin puede asignar roles
  if (context.auth.token.role !== 'Admin') {
    throw new functions.https.HttpsError('permission-denied', 'Requires Admin role');
  }

  const { uid, role, nombre, email } = data;
  if (!uid || !role) {
    throw new functions.https.HttpsError('invalid-argument', 'uid and role required');
  }

  // 1) Asignar Custom Claim
  await admin.auth().setCustomUserClaims(uid, { role });

  // 2) Escribir perfil en Realtime Database
  await admin.database().ref(`/usuarios/${uid}`).set({
    nombre: nombre || '',
    email: email || '',
    rol: role
  });

  return { success: true };
});
```

Despliegue en funciones:
```bash
cd functions
npm install
# (configura GOOGLE_APPLICATION_CREDENTIALS o usa firebase login)
firebase deploy --only functions:assignRole
```

---

## 4) Cliente — cómo llamar `assignRole` (ejemplo)
Se recomienda usar Callable Functions (Firebase Functions client) o enviar ID token al backend.

Callable example (client-side):
```js
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from './config/firebase.init.js';

const functions = getFunctions();
const assignRole = httpsCallable(functions, 'assignRole');

// Asumiendo que el admin ya está autenticado y tiene claim role='Admin'
await assignRole({ uid: 'USER_UID', role: 'Admin', nombre: 'Carlos', email: 'carlos@ejemplo.com' });
```

O con fetch / REST a tu backend (verificar token en servidor):
```js
const token = await auth.currentUser.getIdToken();
await fetch('/api/admin/assignRole', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ uid, role, nombre, email })
})
```

En el backend verificar con Admin SDK:
```js
const decoded = await admin.auth().verifyIdToken(idToken);
if (decoded.role !== 'Admin') throw new Error('No autorizado');
```

---

## 5) Ejemplo de componente React: `UsersList` + `AssignRoleModal` (sketch)

`UsersList` lee `/usuarios` en tiempo real y muestra la lista. Botón "Asignar rol" abre un modal que llama a la función `assignRole`.

```jsx
// src/components/admin/UsersList.jsx
import React, { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../../config/firebase.init';

export default function UsersList() {
  const [users, setUsers] = useState({});

  useEffect(() => {
    const usersRef = ref(db, 'usuarios');
    const unsub = onValue(usersRef, snapshot => {
      setUsers(snapshot.val() || {});
    });
    return () => unsub();
  }, []);

  return (
    <div>
      <h2>Usuarios</h2>
      <ul>
        {Object.entries(users).map(([uid, u]) => (
          <li key={uid}>
            {u.nombre} — {u.email} — {u.rol}
            <button onClick={() => openAssignModal(uid, u)}>Asignar rol</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

`AssignRoleModal` se encarga de enviar la petición a Cloud Function.

---

## 6) Recomendaciones de seguridad
- Asignación de roles solo desde backend/Cloud Functions (Admin SDK).
- Reglas de Realtime DB deben usar `auth.token.role` para controlar escrituras sensibles.
- No exponer keys ni service account en el frontend.
- Para auditoría, considerar escribir un log en `/adminLogs/{timestamp}` cada vez que se cambia un rol o se ejecutan acciones críticas.

---

## 7) Setup y pasos rápidos para el equipo
1. **Frontend**
   - Usa `config/firebase.init.js` ya existente. Importar `auth`, `db`, y `functions` si usan callable.
   - Ejecutar `npm install` y `npm run dev`.
2. **Backend / Cloud Functions**
   - Crear carpeta `functions/` y copiar `functions/index.js` del ejemplo.
   - Configurar `GOOGLE_APPLICATION_CREDENTIALS` o `firebase login`.
   - `npm install firebase-admin firebase-functions`.
   - `firebase deploy --only functions`.
3. **Consola Firebase**
   - Habilitar Email/Password en Authentication → Sign-in method.
   - Ir a Realtime Database → Rules y pegar las reglas (ajustar a producción cuando esté listo).
   - Si se solicita, generar Service Account para backend: Project Settings → Service Accounts → Generate new private key.

---

## 8) Criterios de aceptación (ejemplo: "Asignar rol")
- Un Admin autenticado puede seleccionar un usuario y asignarle un rol.
- El backend valida que el llamador tiene la claim `role === 'Admin'`.
- La función actualiza las custom claims y escribe `/usuarios/{uid}` con el rol.
- Las reglas de Realtime Database impiden que clientes no autorizados escriban campos que solo Admin puede cambiar.

---

Si quieres, puedo:
- A) Añadir `functions/index.js` al repo con la función `assignRole` (lista para desplegar).
- B) Crear los componentes React `UsersList` y `AssignRoleModal` completos y los integro en `/admin/usuarios`.
- C) Preparar un pequeño documento `deploy.md` con comandos exactos para CI/CD y variables de entorno.

Dime cuál prefieres y lo añado al repositorio.
