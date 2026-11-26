// JavaScript del cliente. Sin código inline en las vistas para cumplir la
// Content-Security-Policy (script-src 'self').
document.addEventListener('DOMContentLoaded', () => {
  // Menú desplegable en móvil
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('menu');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }

  // Confirmación antes de acciones destructivas
  document.querySelectorAll('form.js-confirm').forEach((form) => {
    form.addEventListener('submit', (e) => {
      if (!window.confirm(form.dataset.confirm || '¿Seguro?')) e.preventDefault();
    });
  });

  // Contador de caracteres en los textarea con data-counter
  document.querySelectorAll('textarea[data-counter][maxlength]').forEach((ta) => {
    const counter = document.createElement('small');
    counter.className = 'counter';
    counter.setAttribute('aria-live', 'polite');
    const update = () => { counter.textContent = `${ta.value.length} / ${ta.maxLength}`; };
    ta.after(counter);
    ta.addEventListener('input', update);
    update();
  });

  // Validación en el cliente (la validación real se repite en el servidor)
  document.querySelectorAll('form[novalidate]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      const invalid = [...form.elements].filter((el) => el.willValidate && !el.checkValidity());
      if (!invalid.length) return;
      e.preventDefault();
      invalid.forEach((el) => el.setAttribute('aria-invalid', 'true'));
      invalid[0].focus();
      invalid[0].reportValidity();
    });
  });

  // Desaparición automática de los avisos de éxito
  document.querySelectorAll('.alert-success').forEach((el) => {
    setTimeout(() => { el.style.transition = 'opacity .4s'; el.style.opacity = '0'; }, 4000);
    setTimeout(() => el.remove(), 4500);
  });
});

// ---------------------------------------------------------------------------
// Buscador con sugerencias en directo (AJAX con fetch + async/await)
// Mientras el usuario escribe, se consulta la API REST (/api/v1/works?q=...)
// y se muestran hasta 5 obras sin recargar la página. Si JavaScript está
// desactivado, el formulario sigue funcionando de forma normal.
// ---------------------------------------------------------------------------
const TYPE_LABELS = { pelicula: 'Película', libro: 'Libro' };

function setupAutocomplete(input) {
  const list = document.createElement('ul');
  list.className = 'suggestions';
  list.id = `${input.id}-sugerencias`;
  list.setAttribute('role', 'listbox');
  list.hidden = true;
  input.parentElement.classList.add('ac-wrap');
  input.after(list);
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-controls', list.id);
  input.setAttribute('aria-expanded', 'false');

  let timer = null;
  let controller = null; // para cancelar la petición anterior si se sigue escribiendo
  let active = -1;

  const close = () => {
    list.hidden = true;
    list.replaceChildren();
    input.setAttribute('aria-expanded', 'false');
    active = -1;
  };

  const render = (works, query) => {
    list.replaceChildren();
    if (!works.length) {
      const li = document.createElement('li');
      li.className = 'suggestion-empty';
      li.textContent = `Sin resultados para «${query}»`;
      list.append(li);
    }
    works.forEach((w) => {
      const li = document.createElement('li');
      li.setAttribute('role', 'option');
      const a = document.createElement('a');
      a.href = `/works/${w._id}`;
      // textContent (y no innerHTML) para que un título nunca se interprete como HTML
      const title = document.createElement('strong');
      title.textContent = w.title;
      const meta = document.createElement('span');
      meta.className = 'muted';
      const rating = w.reviewCount ? ` · ★ ${w.avgRating.toFixed(1)}` : '';
      meta.textContent = `${TYPE_LABELS[w.type] || ''} · ${w.creator}${w.year ? ` (${w.year})` : ''}${rating}`;
      a.append(title, meta);
      li.append(a);
      list.append(li);
    });
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  };

  async function search(query) {
    if (controller) controller.abort();
    controller = new AbortController();
    try {
      const params = new URLSearchParams({ q: query, limit: '5', sort: 'valoracion' });
      const response = await fetch(`/api/v1/works?${params}`, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      // fetch no lanza error con 404 o 500: hay que comprobar response.ok
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      const data = await response.json();
      if (input.value.trim() === query) render(data.items, query);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error al buscar sugerencias:', error);
        close();
      }
    }
  }

  input.addEventListener('input', () => {
    clearTimeout(timer);
    const query = input.value.trim();
    if (query.length < 2) return close();
    // "debounce": se espera a que el usuario deje de escribir 250 ms
    timer = setTimeout(() => search(query), 250);
    return undefined;
  });

  // Navegación con teclado: flechas, Enter y Escape
  input.addEventListener('keydown', (e) => {
    const links = [...list.querySelectorAll('a')];
    if (list.hidden || !links.length) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      active = (active + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
      links.forEach((a, i) => a.classList.toggle('active', i === active));
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      window.location.href = links[active].href;
    } else if (e.key === 'Escape') {
      close();
    }
  });

  document.addEventListener('click', (e) => {
    if (!input.parentElement.contains(e.target)) close();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('input[data-autocomplete]').forEach(setupAutocomplete);
});
