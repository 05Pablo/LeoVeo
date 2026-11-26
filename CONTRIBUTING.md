# Guía de trabajo en equipo

## Ramas (GitHub Flow simplificado)

- `main`: siempre estable y desplegable. Nadie hace push directo; solo se fusiona por Pull Request.
- `develop`: rama de integración donde se van juntando las funcionalidades.
- `feature/<descripcion>`: una rama por tarea, creada desde `develop`.
  Ejemplos: `feature/auth-sesiones`, `feature/crud-obras`, `fix/media-reseñas`.

```bash
git checkout develop && git pull
git checkout -b feature/crud-obras
# ...cambios...
git add . && git commit -m "feat(obras): crear y editar obras"
git push -u origin feature/crud-obras
# Abrir Pull Request hacia develop en GitHub
```

## Mensajes de commit (Conventional Commits)

`tipo(ámbito): descripción en imperativo`

| Tipo | Uso |
|------|-----|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de un error |
| `docs` | Solo documentación |
| `refactor` | Cambio de código sin cambiar comportamiento |
| `style` | Formato, CSS |
| `chore` | Configuración, dependencias, Docker |

## Pull Requests

1. Rellenar la plantilla del PR (qué cambia y cómo probarlo).
2. Al menos **un compañero revisa y aprueba** antes de fusionar.
3. La comprobación automática de GitHub Actions (CI) debe pasar.
4. Se fusiona con *Squash and merge* y se borra la rama.

## Reparto de tareas

Usamos **Issues** y un **Project (tablero Kanban)** de GitHub con las columnas *Por hacer*, *En curso*, *En revisión* y *Hecho*. Cada issue se asigna a una persona y se cierra desde el PR con `Closes #número`.

## Normas de código

- Estructura MVC + servicios: la lógica de negocio va en `src/services`, nunca en las rutas ni en las vistas.
- Toda entrada del usuario se valida en `src/validators` (y se vuelve a validar en el modelo).
- Nunca subir `.env`, contraseñas ni `node_modules`.
- Ejecutar `npm run check` antes de cada commit.
