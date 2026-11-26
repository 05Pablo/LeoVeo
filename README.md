# LeoVeo · Reseñas de películas y libros

Aplicación web completa para reseñar películas y libros: los usuarios se registran, añaden obras, publican reseñas con puntuación de 1 a 5 y consultan las mejor valoradas. Incluye un rol de administrador que modera el contenido y gestiona usuarios.

Proyecto de la asignatura **Programación de Servidores Web**.

| | |
|---|---|
| **Frontend** | HTML + CSS + JavaScript, vistas renderizadas con EJS |
| **Backend** | Node.js 20 + Express 4, arquitectura MVC con capa de servicios |
| **Base de datos** | MongoDB 7 con Mongoose |
| **Autenticación** | Sesiones con `express-session` guardadas en MongoDB (`connect-mongo`), contraseñas con bcrypt |
| **Seguridad** | Helmet (CSP y cabeceras), CSRF, rate limiting, validación con express-validator, saneado anti inyección NoSQL |
| **Despliegue** | Docker + Docker Compose |
| **API** | REST JSON versionada en `/api/v1`, documentada con OpenAPI 3 · Swagger UI en `/api-docs` · ver [docs/API.md](docs/API.md) |

## Funcionalidades

- Registro, inicio y cierre de sesión.
- Buscador con **sugerencias en directo** mientras escribes (JavaScript con `fetch` contra la API).
- Catálogo de obras con búsqueda por texto, filtros por tipo y género, ordenación y paginación.
- Ficha de cada obra con nota media, número de reseñas y listado de reseñas.
- Crear, editar y borrar reseñas propias (una por obra y usuario).
- Perfil público de cada usuario con sus reseñas y estadísticas; edición de la bio propia.
- **Roles y permisos**:

| Acción | Visitante | Usuario | Autor del recurso | Admin |
|---|:---:|:---:|:---:|:---:|
| Ver obras, reseñas y perfiles | ✅ | ✅ | ✅ | ✅ |
| Añadir obra / escribir reseña | | ✅ | ✅ | ✅ |
| Editar obra | | | ✅ | ✅ |
| Borrar obra (y sus reseñas) | | | | ✅ |
| Editar reseña | | | ✅ | |
| Borrar reseña | | | ✅ | ✅ |
| Gestionar roles de usuarios | | | | ✅ |

## Puesta en marcha con Docker (recomendado)

Requisitos: Docker Desktop (o Docker Engine + Compose v2).

```bash
git clone https://github.com/<usuario>/leoveo.git
cd leoveo
cp .env.example .env
# Edita .env y pon un SESSION_SECRET largo y aleatorio:
#   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

docker compose up -d --build        # arranca MongoDB y la app
docker compose exec app npm run seed  # carga datos de ejemplo (opcional)
```

Abre <http://localhost:3000>. La documentación interactiva de la API está en <http://localhost:3000/api-docs>.

Usuarios de ejemplo (creados por el seed):

| Rol | Email | Contraseña |
|---|---|---|
| Admin | `admin@leoveo.es` | `Admin1234` |
| Usuario | `lucia@leoveo.es` | `Lucia1234` |
| Usuario | `marcos@leoveo.es` | `Marcos1234` |

Otros comandos útiles:

```bash
docker compose logs -f app                      # ver los logs
docker compose exec app npm run seed -- --reset # recargar los datos de ejemplo
docker compose down                             # parar (los datos se conservan)
docker compose down -v                          # parar y borrar la base de datos
```

## Puesta en marcha en local (sin Docker)

Requisitos: Node.js 20 o superior y una instancia de MongoDB (local o Atlas).

```bash
npm install
cp .env.example .env     # ajusta MONGO_URI si hace falta
npm run seed             # opcional
npm run dev              # arranca con recarga automática
```

> Tras el primer `npm install` se genera `package-lock.json`: súbelo al repositorio para que todo el equipo y Docker usen exactamente las mismas versiones.

### Variables de entorno

| Variable | Descripción | Por defecto |
|---|---|---|
| `NODE_ENV` | `development` o `production` | `development` |
| `PORT` | Puerto HTTP | `3000` |
| `MONGO_URI` | Cadena de conexión a MongoDB | `mongodb://localhost:27017/leoveo` |
| `SESSION_SECRET` | Secreto para firmar la cookie de sesión (**obligatorio en producción**) | — |
| `COOKIE_SECURE` | `true` si se sirve por HTTPS | `false` |
| `TRUST_PROXY` | Nº de proxies inversos delante de la app | `0` |
| `BCRYPT_ROUNDS` | Coste del hash de contraseñas | `12` |

### Scripts

| Script | Qué hace |
|---|---|
| `npm start` | Arranca el servidor |
| `npm run dev` | Arranca con `node --watch` |
| `npm run seed` | Carga datos de ejemplo (`-- --reset` para vaciar antes) |
| `npm run check` | Comprueba la sintaxis de todos los ficheros JS |

## Estructura del proyecto

```
leoveo/
├── src/
│   ├── app.js               # Configuración de Express (middlewares, rutas, errores)
│   ├── server.js            # Conexión a la BD, arranque y apagado ordenado
│   ├── config/              # Variables de entorno y conexión a MongoDB
│   ├── models/              # (M) Esquemas Mongoose: User, Work, Review
│   ├── services/            # Lógica de negocio y reglas de permisos
│   ├── controllers/         # (C) Controladores web
│   │   └── api/             #     Controladores de la API JSON
│   ├── routes/              # web.js (páginas), api.js (/api/v1) y docs.js (/api-docs)
│   ├── middlewares/         # auth, csrf, sanitize, flash, rate limit, errores
│   ├── validators/          # Reglas de express-validator
│   ├── utils/               # AppError, helpers, sesión
│   ├── docs/openapi.yaml    # Especificación OpenAPI 3 de la API
│   └── views/               # (V) Plantillas EJS
├── public/                  # CSS, JS del cliente y favicon
├── scripts/                 # seed.js y check-syntax.js
├── docs/                    # API.md y guion de la presentación
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

## Uso de la API (ejemplo rápido)

La API usa la misma sesión que la web (cookie `leoveo.sid`). Con `curl`:

```bash
# Iniciar sesión y guardar la cookie
curl -c cookies.txt -H "Content-Type: application/json" \
  -d '{"email":"lucia@leoveo.es","password":"Lucia1234"}' \
  http://localhost:3000/api/v1/auth/login

# Listar obras de ciencia ficción ordenadas por valoración
curl "http://localhost:3000/api/v1/works?genre=ciencia%20ficci%C3%B3n&sort=valoracion"

# Publicar una reseña
curl -b cookies.txt -H "Content-Type: application/json" \
  -d '{"rating":4,"title":"Muy recomendable","body":"Me ha gustado mucho la ambientación."}' \
  http://localhost:3000/api/v1/works/<ID_OBRA>/reviews
```

Documentación completa: **[docs/API.md](docs/API.md)** y, con la app en marcha, la documentación interactiva de Swagger UI en **<http://localhost:3000/api-docs>**: ahí se pueden probar todos los endpoints con el botón *Try it out*.

## Trabajo en equipo

Flujo de ramas, convención de commits y revisión de Pull Requests en **[CONTRIBUTING.md](CONTRIBUTING.md)**.

## Autores

- Nombre Apellido 1 — @usuario1
- Nombre Apellido 2 — @usuario2
- Nombre Apellido 3 — @usuario3
