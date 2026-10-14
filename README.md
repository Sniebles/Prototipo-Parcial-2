# Cómo instalar y ejecutar el prototipo

Necesita **Node.js 20 o superior** y **MySQL 8** (también sirve el MySQL/MariaDB de XAMPP).
No mueva la carpeta `prototipo` fuera de `Parcial2_Delta`: los scripts de la base de datos están en `Parcial2_Delta/database`.

## 0. Antes de empezar

1. Abra una terminal y ejecute `node -v`. Debe mostrar `v20` o un número mayor. Si dice que no se reconoce el comando, instale Node.js desde nodejs.org y **abra una terminal nueva**.
2. Encienda MySQL:
   - **XAMPP:** botón *Start* de MySQL.
   - **MySQL instalado como servicio:** debe estar en ejecución (Servicios de Windows → MySQL80).
3. Tenga a mano el **usuario y la contraseña de MySQL**:
   - XAMPP usa `root` sin contraseña.
   - MySQL Installer usa `root` con la contraseña que puso al instalarlo.

> **Cómo abrir la terminal en la carpeta correcta (Windows):** abra la carpeta en el Explorador de archivos, escriba `cmd` en la barra de direcciones y presione Enter. Use esa ventana (*Símbolo del sistema*) y no PowerShell, así evita errores de permisos con `npm`.

## 1. Configurar la conexión a MySQL (obligatorio)

Abra el archivo `prototipo/backend/.env` con un editor de texto y cambie estas dos líneas por **sus** datos de MySQL:

```
DB_USER=root
DB_PASSWORD=su_contraseña
```

- Si su MySQL no tiene contraseña (XAMPP), deje `DB_PASSWORD=` vacío.
- Si la contraseña tiene `#`, espacios o comillas, escríbala entre comillas: `DB_PASSWORD="mi#clave"`.
- Guarde el archivo con el nombre exacto `.env`. El Bloc de notas a veces lo guarda como `.env.txt` y entonces no funciona.

Sin este paso la API no puede entrar a MySQL y nada funciona.

## 2. Instalar dependencias y crear las bases de datos

En una terminal abierta en `prototipo/backend`:

```
npm install
npm run db:init
```

`db:init` borra y vuelve a crear las bases `delta_oltp` y `delta_dw` ejecutando los 5 scripts de `Parcial2_Delta/database` (también carga el datawarehouse y prueba sus 3 consultas). Debe terminar con:

```
✔ 01_schema.sql ...
✔ 02_procedimientos.sql ...
✔ 03_datos.sql ...
✔ 04_dw.sql ...
✔ 05_consultas_dw.sql (...; consultas 4a, 4b y 4c: 7, 7, 35 filas)
✔ Contraseña de los usuarios de prueba: Demo1234*
```

Si muestra una ✖, lea el mensaje: indica qué corregir (casi siempre es el paso 1 o que MySQL está apagado). Corrija y repita `npm run db:init`.

En otra terminal abierta en `prototipo/frontend`:

```
npm install
```

## 3. Ejecutar

Se necesitan **dos terminales abiertas al mismo tiempo**. No las cierre mientras usa la aplicación.

| Terminal | Carpeta | Comando | Debe mostrar |
|---|---|---|---|
| 1 (API) | `prototipo/backend` | `npm run dev` | `✔ Conectado a la base de datos delta_oltp` |
| 2 (web) | `prototipo/frontend` | `npm run dev` | `Local: http://localhost:5173/` |

Abra **http://localhost:5173** en el navegador. Inicie sesión con cualquiera de estos usuarios (contraseña `Demo1234*`):

- `sofia.martinez20@correo.test` (pasajero: reservas, pago, check-in, maletas, millas, atención)
- `mark.lewis@delta.test` (agente de embarque en ATL: vuelos del día, etapas, embarque, equipaje, casos, datawarehouse)
- `felipe.gomez@delta.test` (operaciones en BOG)
- `natalia.perez@delta.test` (servicio al cliente)

Para pagar en la pasarela simulada use la tarjeta `4111 1111 1111 1111` (se aprueba) o la `4000 0000 0000 0002` (se rechaza).

## Si algo sale mal

| Mensaje o síntoma | Solución |
|---|---|
| `"vite" no se reconoce...` o `Falta instalar las dependencias` | No se ejecutó (o falló) `npm install` en esa carpeta. Ejecute `npm install` ahí mismo y luego repita el comando. |
| `'node' / 'npm' no se reconoce...` | Instale Node.js 20+ y abra una terminal nueva. |
| `npm.ps1 no se puede cargar... ejecución de scripts deshabilitada` | Está en PowerShell: use *Símbolo del sistema* (`cmd`), como se explica en el paso 0. |
| `No se pudo conectar a MySQL` / `ECONNREFUSED` | MySQL está apagado: enciéndalo (paso 0.2) y repita el comando. |
| `MySQL rechazó el usuario` / `Access denied` | Usuario o contraseña incorrectos en `backend/.env` (paso 1). |
| `No existe el archivo ...\.env` | El archivo se guardó como `.env.txt` o se borró: vuelva a crearlo (paso 1). |
| `La base de datos delta_oltp (o delta_dw) no existe` | Falta el paso 2: `npm run db:init`. |
| `El puerto 4000 ya está en uso` | Ya hay otra terminal con la API abierta: ciérrela o use esa. |
| La página dice *No hay conexión con el servidor* | La terminal 1 (API) no está corriendo o se cerró. |
| `Email o contraseña incorrectos` con los usuarios de prueba | La base se creó desde MySQL Workbench y no con `npm run db:init`: ejecute `npm run db:init`. |
| La búsqueda no muestra vuelos | Los datos de prueba tienen vuelos durante 2026: elija una fecha de 2026 (por ejemplo 2026-10-20, ATL → JFK). |
| El datawarehouse aparece vacío | Pulse **Cargar datawarehouse (ETL)** en la pantalla *Datawarehouse*. |
| `npm install` falla con errores de red | Revise la conexión a internet y repita `npm install`. |
