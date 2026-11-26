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
