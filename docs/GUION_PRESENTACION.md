# Guion de la presentación (15 minutos)

Reparto pensado para tres personas (**P1**, **P2**, **P3**), unos 5 minutos cada una. La demo ocupa casi la mitad del tiempo porque es lo que más se valora.

## Antes de empezar (checklist)

- [ ] `docker compose down -v && docker compose up -d --build` y después `docker compose exec app npm run seed`: datos limpios.
- [ ] Dos navegadores (o uno normal y otro en incógnito): uno con **lucia** y otro con **admin**.
- [ ] Una terminal abierta con los comandos `curl` preparados (sección 4).
- [ ] El repositorio de GitHub abierto en la pestaña de *Pull requests* (cerradas) y en *Actions*.
- [ ] Zoom del navegador al 125 % para que se lea bien en el proyector.
- [ ] Plan B: capturas o un vídeo corto de la demo por si falla la red o Docker.

---

## 1. Introducción · P1 · 1:30

- Qué es LeoVeo: reseñas de películas y libros con nota media, búsqueda y perfiles.
- Por qué esta temática: varios roles, relaciones entre datos, texto libre que hay que proteger y datos calculados.
- Stack en una frase: *Node + Express con MVC, vistas EJS, MongoDB con Mongoose, sesiones, todo en Docker*.

## 2. Arquitectura y base de datos · P1 · 3:00

- Mostrar el **diagrama de arquitectura** del informe (Figura 1).
- MVC **más capa de servicios**: la web y la API comparten las mismas reglas de permisos. Enseñar `src/services/reviewService.js` → `canEdit` / `canDelete`.
- **Modelo de datos** (Figura 2): users, works, reviews con referencias.
  - Índice único `{ work, author }`: una reseña por usuario y obra.
  - `avgRating` desnormalizado y recalculado con una agregación (enseñar `recalculateWorkStats` en `models/Review.js`).

## 3. Demo funcional · P2 · 6:00

| # | Acción | Qué se quiere demostrar |
|---|---|---|
| 1 | Entrar sin sesión: escribir «nol» en el buscador de la portada → aparecen sugerencias al momento (enseñar la pestaña *Red* de las DevTools con la petición a `/api/v1/works`) | AJAX con `fetch` y `async/await` |
| 1b | Explorar → filtrar *Películas* y ordenar por *Mejor valoradas* | Catálogo, filtros y paginación |
| 2 | Abrir *Interstellar* e intentar reseñar → pide login → entrar como **lucia** → vuelve a la misma página | Autenticación y redirección tras el login |
| 3 | Enviar la reseña vacía | Validación (en el cliente y en el servidor) |
| 4 | Publicar la reseña con 4 estrellas → la nota media cambia | Persistencia y recálculo de la media |
| 5 | Intentar reseñar otra vez la misma obra → aparece «Editar mi reseña» | Regla de una reseña por obra |
| 6 | Añadir una obra nueva → editarla | CRUD y propiedad del recurso |
| 7 | Ir a *Parásitos* (añadida por marcos): no aparece «Editar» | Autorización por propietario |
| 8 | Perfil de lucia: estadísticas, editar bio | Perfiles |
| 9 | En el otro navegador como **admin**: borrar la reseña de un usuario y abrir *Admin* → hacer admin a marcos | Rol de administrador, moderación |
| 10 | Volver a lucia y pegar en la URL `/admin/users` → página 403 | Control de acceso |

## 4. API y seguridad · P3 · 3:30

Primero abrir **<http://localhost:3000/api-docs>** (Swagger UI):

- Enseñar las etiquetas y los esquemas: está generado a partir de `src/docs/openapi.yaml` (OpenAPI 3).
- *Try it out* en `POST /auth/login` con lucia → `GET /auth/me` devuelve su usuario porque la cookie de sesión ya va en las peticiones.
- Mencionar el **versionado** `/api/v1`.

Después, en la terminal:

```bash
curl -s localhost:3000/api/v1/health
curl -s "localhost:3000/api/v1/works?type=libro&sort=valoracion&limit=3"

# Sin sesión → 401
curl -s -X POST -H "Content-Type: application/json" -d '{}' localhost:3000/api/v1/works

# Login y error de validación → 422 con el detalle por campo
curl -s -c c.txt -H "Content-Type: application/json" \
  -d '{"email":"marcos@leoveo.es","password":"Marcos1234"}' localhost:3000/api/v1/auth/login
curl -s -b c.txt -H "Content-Type: application/json" -d '{"rating":9}' \
  localhost:3000/api/v1/works/<ID>/reviews

# Intento de inyección NoSQL en el login → 422/401, no entra
curl -s -H "Content-Type: application/json" \
  -d '{"email":{"$ne":""},"password":{"$ne":""}}' localhost:3000/api/v1/auth/login
```

Seguridad (enseñar 3 o 4 medidas, no todas):

- **Contraseñas con bcrypt** → enseñar un usuario en la BD: solo se ve el hash.
- **XSS**: escribir una reseña con `<script>alert(1)</script>` → se muestra como texto. Además, la CSP de helmet (pestaña *Red* del navegador → cabeceras).
- **CSRF**: campo oculto `_csrf` en los formularios (inspeccionar el HTML).
- **Fuerza bruta**: tras 10 intentos fallidos de login, error 429.
- **Cookie de sesión** `httpOnly` y `SameSite` (pestaña *Aplicación* del navegador).

## 5. Docker, equipo y cierre · P3 · 1:00

- `docker compose ps`: dos contenedores, la BD sin puerto expuesto y los healthchecks en verde.
- GitHub: ramas `feature/*`, Pull Requests revisados y la CI en verde.
- Conclusión en una frase y mejoras futuras: tests automáticos, subida de portadas y HTTPS.
- «¿Preguntas?»

---

## Posibles preguntas del profesor

- **¿Por qué sesiones y no JWT?** Con vistas renderizadas en el servidor, la cookie de sesión `httpOnly` es lo más simple y seguro: se puede invalidar en el servidor (logout real) y no se expone a JavaScript. JWT tiene más sentido con un frontend separado o con clientes móviles.
- **¿Por qué guardar la media en lugar de calcularla?** Para poder ordenar y paginar por valoración con un índice. Se mantiene coherente porque se recalcula en cada alta, edición o baja de reseñas.
- **¿Qué pasa si dos peticiones crean la misma reseña a la vez?** El índice único de MongoDB rechaza la segunda (error 11000 → 409).
- **¿Cómo evitáis CSRF en la API?** Se exige `Content-Type: application/json` (un formulario de otro sitio no puede enviarlo sin preflight CORS) y la cookie es `SameSite=Lax`.
- **¿Por qué una capa de servicios si el enunciado pide MVC?** Es MVC; los servicios solo sacan la lógica de negocio de los controladores para reutilizarla entre la web y la API.
- **¿Por qué `/api/v1`?** Para poder publicar cambios incompatibles en `/v2` sin romper a quien usa `/v1` (tema 4).
- **¿Por qué no usáis CORS?** La web y la API se sirven desde el mismo origen (mismo protocolo, dominio y puerto), así que el navegador no hace peticiones cruzadas. Si hubiera un frontend en otro dominio, se configuraría `cors` con ese origen concreto y `credentials: true`, nunca `cors()` abierto.
- **¿Qué haríais para producción?** Proxy inverso con HTTPS, `COOKIE_SECURE=true`, `TRUST_PROXY=1`, MongoDB con autenticación o Atlas, copias de seguridad del volumen y tests en la CI.
