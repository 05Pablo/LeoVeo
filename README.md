# LeoVeo · Reseñas de películas y libros

Aplicación web para reseñar películas y libros (Node.js, Express, EJS y MongoDB).

> 🚧 En desarrollo. Hecho: registro/login, obras y reseñas. Pendiente: API REST, panel de administración y endurecimiento de seguridad.

## Puesta en marcha

```bash
cp .env.example .env
docker compose up -d --build
```

Abre <http://localhost:3000>.

Sin Docker: `npm install` y `npm run dev` (necesita MongoDB en `MONGO_URI`).

Datos de ejemplo: `docker compose exec app npm run seed` (admin@leoveo.es / Admin1234).

## Autores

- José Ignacio Hernández Pablos — @pepehernandez05
- Alberto Olmos Alcaide — @Godalberto10
- Pablo Gallego García — @05Pablo
