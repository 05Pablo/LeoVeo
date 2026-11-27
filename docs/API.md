# API REST de LeoVeo

URL base: `http://localhost:3000/api/v1`

> **Documentación interactiva:** con la app en marcha, abre <http://localhost:3000/api-docs> (Swagger UI). Se genera a partir de la especificación OpenAPI 3 de [`src/docs/openapi.yaml`](../src/docs/openapi.yaml) y permite probar cada endpoint con *Try it out*. La especificación en JSON está en `/api-docs/openapi.json`, para importarla en Postman o Insomnia.

> **Versionado:** la versión va en la URL (`/v1`). Un cambio incompatible se publicaría en `/api/v2`, manteniendo `/v1` para los clientes que ya la usan.

## Convenciones

- **Formato**: todas las respuestas son JSON. Las peticiones `POST`, `PUT` y `PATCH` deben enviar `Content-Type: application/json` (si no, `415`). Es una de las medidas anti-CSRF de la API.
- **Autenticación**: por sesión. Tras `POST /auth/login` o `POST /auth/register`, el servidor devuelve la cookie `leoveo.sid` (httpOnly, SameSite=Lax) que hay que reenviar en las siguientes peticiones.
- **Identificadores**: `ObjectId` de MongoDB (24 caracteres hexadecimales).
- **Paginación**: parámetros `page` (desde 1) y `limit` (máx. 50). Las respuestas paginadas tienen la forma `{ items, total, page, pages }`.
- **Límite de peticiones**: 120 por minuto e IP en toda la API; 10 intentos fallidos cada 15 minutos en login y registro.

### Formato de error

```json
{ "error": "Datos no válidos", "details": { "rating": "La puntuación va de 1 a 5" } }
```

| Código | Significado |
|---|---|
| `400` | Petición mal formada (JSON inválido, id no válido) |
| `401` | No has iniciado sesión |
| `403` | Sesión iniciada pero sin permiso (rol o propietario) |
| `404` | Recurso no encontrado |
| `409` | Conflicto (email ya registrado, reseña duplicada) |
| `415` | Falta `Content-Type: application/json` |
| `422` | Errores de validación (detalle por campo en `details`) |
| `429` | Demasiadas peticiones |
| `500` | Error interno |

## Resumen de endpoints

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/health` | Público | Estado del servicio y de la BD |
| POST | `/auth/register` | Público | Crear cuenta e iniciar sesión |
| POST | `/auth/login` | Público | Iniciar sesión |
| POST | `/auth/logout` | Usuario | Cerrar sesión |
| GET | `/auth/me` | Usuario | Usuario autenticado |
| GET | `/works` | Público | Listar/buscar obras |
| GET | `/genres` | Público | Géneros existentes |
| GET | `/works/:id` | Público | Detalle de una obra |
| POST | `/works` | Usuario | Crear obra |
| PUT | `/works/:id` | Creador o admin | Modificar obra |
| DELETE | `/works/:id` | Admin | Borrar obra y sus reseñas |
| GET | `/works/:id/reviews` | Público | Reseñas de una obra |
| POST | `/works/:id/reviews` | Usuario | Reseñar una obra (una por usuario) |
| GET | `/reviews` | Público | Últimas 10 reseñas |
| GET | `/reviews/:id` | Público | Detalle de una reseña |
| PUT | `/reviews/:id` | Autor | Modificar reseña |
| DELETE | `/reviews/:id` | Autor o admin | Borrar reseña |
| GET | `/users/:username` | Público | Perfil público, estadísticas y reseñas |
| GET | `/admin/users` | Admin | Listar usuarios |
| PATCH | `/admin/users/:id/role` | Admin | Cambiar el rol de un usuario |

---

## Salud

### `GET /health`

```json
{ "status": "ok", "db": "up", "uptime": 132.5 }
```

## Autenticación

### `POST /auth/register`

| Campo | Tipo | Reglas |
|---|---|---|
| `username` | string | 3-30 caracteres, letras, números y `_`. Único |
| `email` | string | Email válido. Único |
| `password` | string | 8-72 caracteres, al menos una letra y un número |
| `passwordConfirm` | string | Opcional; si se envía, debe coincidir |

```json
{ "username": "pablo", "email": "pablo@example.com", "password": "Secreta123" }
```

**201**

```json
{ "user": { "_id": "665f…", "username": "pablo", "email": "pablo@example.com", "role": "user", "bio": "", "createdAt": "2026-11-22T18:00:00.000Z" } }
```

Errores: `409` (email o usuario ya existen), `422`.

### `POST /auth/login`

```json
{ "email": "lucia@leoveo.es", "password": "Lucia1234" }
```

**200** `{ "user": { … } }` · **401** `{ "error": "Email o contraseña incorrectos" }`

El mensaje de error es el mismo exista o no el email, para no revelar qué cuentas están registradas.

### `POST /auth/logout`

**204** sin cuerpo. Destruye la sesión en el servidor y borra la cookie.

### `GET /auth/me`

**200** `{ "user": { … } }` · **401** si no hay sesión.

## Obras

Objeto `Work`:

```json
{
  "_id": "665f1c…",
  "title": "Dune",
  "type": "libro",
  "creator": "Frank Herbert",
  "year": 1965,
  "genres": ["ciencia ficción", "aventura"],
  "synopsis": "Paul Atreides llega a Arrakis…",
  "coverUrl": "",
  "avgRating": 4.5,
  "reviewCount": 2,
  "createdBy": "665f1b…",
  "createdAt": "2026-11-22T18:00:00.000Z",
  "updatedAt": "2026-11-22T18:00:00.000Z"
}
```

### `GET /works`

| Parámetro | Descripción |
|---|---|
| `q` | Busca en título y director/autor (sin distinguir mayúsculas) |
| `type` | `pelicula` o `libro` |
| `genre` | Un género exacto, p. ej. `drama` |
| `sort` | `recientes` (defecto), `valoracion`, `populares`, `titulo` |
| `page`, `limit` | Paginación (por defecto 12 por página) |

```
GET /api/v1/works?type=pelicula&sort=valoracion&limit=5
```

**200**

```json
{ "items": [ { "…": "Work" } ], "total": 5, "page": 1, "pages": 1, "limit": 5, "sort": "valoracion" }
```

### `GET /genres`

**200** `{ "genres": ["animación", "aventura", "ciencia ficción", "…"] }`

### `GET /works/:id`

**200** `{ "work": { …, "createdBy": { "_id": "…", "username": "lucia" } } }` · **404**

### `POST /works` (usuario)

| Campo | Tipo | Reglas |
|---|---|---|
| `title` | string | Obligatorio, máx. 150 |
| `type` | string | `pelicula` o `libro` |
| `creator` | string | Obligatorio, máx. 100 |
| `year` | number | Opcional, 1800-2100 |
| `genres` | string o string[] | Opcional. `"drama, thriller"` o `["drama","thriller"]`; máx. 8 |
| `synopsis` | string | Opcional, máx. 2000 |
| `coverUrl` | string | Opcional, URL `http(s)` |

```json
{ "title": "Matrix", "type": "pelicula", "creator": "Lana y Lilly Wachowski", "year": 1999, "genres": ["ciencia ficción", "acción"] }
```

**201** `{ "work": { … } }` con cabecera `Location: /api/v1/works/<id>`.

Los campos `avgRating`, `reviewCount` y `createdBy` los calcula el servidor; si se envían, se ignoran.

### `PUT /works/:id` (creador de la obra o admin)

Mismo cuerpo que `POST /works`. **200** `{ "work": { … } }` · **403** si no eres el creador ni admin.

### `DELETE /works/:id` (admin)

**204**. Borra también todas las reseñas de la obra.

## Reseñas

Objeto `Review`:

```json
{
  "_id": "6660aa…",
  "work": "665f1c…",
  "author": { "_id": "665f1b…", "username": "marcos" },
  "rating": 5,
  "title": "La biblia de la ciencia ficción",
  "body": "Política, ecología y religión en un mismo libro.",
  "createdAt": "2026-11-22T18:00:00.000Z",
  "updatedAt": "2026-11-22T18:00:00.000Z"
}
```

### `GET /works/:id/reviews`

Paginado (20 por defecto, más recientes primero). **200** `{ "items": [Review], "total", "page", "pages" }`

### `POST /works/:id/reviews` (usuario)

| Campo | Tipo | Reglas |
|---|---|---|
| `rating` | integer | 1 a 5 |
| `title` | string | Obligatorio, máx. 100 |
| `body` | string | 10 a 3000 caracteres |

**201** `{ "review": { … } }` · **409** si ya has reseñado esa obra · **404** si la obra no existe.

Tras crear, editar o borrar una reseña se recalculan `avgRating` y `reviewCount` de la obra.

### `GET /reviews`

Últimas 10 reseñas de toda la plataforma, con autor y obra. **200** `{ "items": [Review] }`

### `GET /reviews/:id`

**200** `{ "review": { … } }` · **404**

### `PUT /reviews/:id` (autor)

Mismo cuerpo que la creación. **200** · **403** si no eres el autor.

### `DELETE /reviews/:id` (autor o admin)

**204**

## Usuarios

### `GET /users/:username`

Perfil público (sin email).

```json
{
  "user": { "_id": "…", "username": "lucia", "bio": "Cine de autor y novela negra.", "role": "user", "createdAt": "…" },
  "stats": { "reviewCount": 4, "avgRating": 4.5 },
  "reviews": [ { "…": "Review con work.title y work.type" } ]
}
```

### `GET /admin/users` (admin)

**200** `{ "items": [User] }` (sin contraseñas).

### `PATCH /admin/users/:id/role` (admin)

```json
{ "role": "admin" }
```

**200** `{ "user": { … } }` · **400** si el rol no es válido o intentas cambiar tu propio rol.

---

## Prueba rápida con curl

```bash
BASE=http://localhost:3000/api/v1

curl -s $BASE/health

# Login (guarda la cookie de sesión en cookies.txt)
curl -s -c cookies.txt -H "Content-Type: application/json" \
  -d '{"email":"marcos@leoveo.es","password":"Marcos1234"}' $BASE/auth/login

# Crear obra
curl -s -b cookies.txt -H "Content-Type: application/json" \
  -d '{"title":"Matrix","type":"pelicula","creator":"Wachowski","year":1999,"genres":"ciencia ficción, acción"}' \
  $BASE/works

# Sin sesión → 401
curl -s -X POST -H "Content-Type: application/json" -d '{}' $BASE/works

# Usuario normal intentando borrar una obra → 403
curl -s -b cookies.txt -X DELETE $BASE/works/<ID>
```
