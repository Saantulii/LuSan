const calendarGrid = document.getElementById('calendar-grid');
const monthDisplay  = document.getElementById('month-display');
const yearDisplay   = document.getElementById('year-display');
const prevBtn       = document.getElementById('prev-month');
const nextBtn       = document.getElementById('next-month');

let today        = new Date();
let currentYear  = today.getFullYear();
let currentMonth = today.getMonth();
let events       = JSON.parse(localStorage.getItem('events') || '[]');

function renderCalendar(year, month) {
  // Mostrar mes en inglés
  monthDisplay.textContent = new Date(year, month)
    .toLocaleString('en-US', { month: 'long' })
    .replace(/^\w/, c => c.toUpperCase());
  yearDisplay.textContent = year;

  // Limpiar viejos días (dejamos los 7 encabezados)
  while (calendarGrid.children.length > 7) {
    calendarGrid.removeChild(calendarGrid.lastChild);
  }

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Casillas vacías antes del primer día
  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement('div');
    empty.classList.add('day');
    calendarGrid.appendChild(empty);
  }

  // Celdas de cada día
  for (let d = 1; d <= daysInMonth; d++) {
    const cell    = document.createElement('div');
    cell.classList.add('day');
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    cell.dataset.date = dateStr;
    cell.innerHTML = `<span class="number">${d}</span>`;
    cell.addEventListener('click', () => openModal(dateStr));

    // Eventos del día (incluye recurrences salvo excepciones)
    events.forEach(e => {
      // ignorar si este día está marcado como excepción
      if (e.exceptions?.includes(dateStr)) return;

      const base = new Date(e.date);
      const cur  = new Date(dateStr);
      let match = false;

      if (e.recurring === 'none') {
        match = (e.date === dateStr);
      } else if (cur >= base) {
        if (e.recurring === 'daily') match = true;
        else if (e.recurring === 'weekly' && Math.floor((cur - base)/86400000) % 7 === 0) match = true;
        else if (e.recurring === 'monthly' && cur.getDate() === base.getDate()) match = true;
        else if (e.recurring === 'yearly' &&
                 cur.getDate() === base.getDate() &&
                 cur.getMonth() === base.getMonth()) match = true;
      }

      if (match) {
        const ev = document.createElement('span');
        ev.classList.add('event', e.category);
        ev.textContent = e.title;
        ev.addEventListener('click', evClick => {
          evClick.stopPropagation();
          openModal(dateStr, e.id);
        });
        cell.appendChild(ev);
      }
    });

    // Corazoncito indicativo
    if (cell.querySelector('.event')) {
      const heart = document.createElement('span');
      heart.classList.add('day-heart');
      heart.textContent = '❤️';
      cell.appendChild(heart);
    }

    calendarGrid.appendChild(cell);
  }
}

// Modal & Form
const modal      = document.getElementById('event-modal');
const form       = document.getElementById('event-form');
const dateInput  = document.getElementById('evt-date');
const titleInput = document.getElementById('evt-title');
const catInput   = document.getElementById('evt-cat');
const recInput   = document.getElementById('evt-recurring');
// El botón de eliminar debe existir en tu HTML con id="delete-btn"
const deleteBtn  = document.getElementById('delete-btn');
let editingId    = null;

function openModal(date = null, id = null) {
  modal.style.display = 'flex';
  if (id != null) {
    // Editar evento existente
    const ev = events.find(x => x.id === id);
    dateInput.value    = date;            // muestra siempre la celda clickeada
    titleInput.value   = ev.title;
    catInput.value     = ev.category;
    recInput.value     = ev.recurring || 'none';
    document.getElementById('modal-title').textContent = 'Editar Evento';
    deleteBtn.style.display = 'inline-block';
    editingId = id;
  } else {
    // Nuevo evento
    dateInput.value    = date;
    titleInput.value   = '';
    catInput.value     = 'cat-sobre';
    recInput.value     = 'none';
    document.getElementById('modal-title').textContent = 'Añadir Evento';
    deleteBtn.style.display = 'none';
    editingId = null;
  }
}

deleteBtn.addEventListener('click', () => {
  const ev = events.find(x => x.id === editingId);
  // Preguntar al usuario
  const soloEsta = confirm(
    '¿Eliminar solo esta ocurrencia?\n\n' +
    'Aceptar = Solo esta fecha\n' +
    'Cancelar = Todas las ocurrencias (anteriores y posteriores)'
  );

  if (soloEsta || ev.recurring === 'none') {
    // Si es recurrente: marcamos esta fecha como excepción
    if (ev.recurring !== 'none') {
      ev.exceptions = [...(ev.exceptions||[]), dateInput.value];
    } else {
      // Evento único: eliminamos por completo
      events = events.filter(x => x.id !== editingId);
    }
  } else {
    // Borrar todas las ocurrencias: eliminamos el evento base
    events = events.filter(x => x.id !== editingId);
  }

  localStorage.setItem('events', JSON.stringify(events));
  modal.style.display = 'none';
  renderCalendar(currentYear, currentMonth);
});

document.getElementById('cancel-btn').onclick = () => {
  modal.style.display = 'none';
};

form.addEventListener('submit', e => {
  e.preventDefault();
  const baseEvent = events.find(x => x.id === editingId) || {};
  const evData = {
    id:         editingId || Date.now(),
    date:       dateInput.value,
    title:      titleInput.value,
    category:   catInput.value,
    recurring:  recInput.value,
    exceptions: baseEvent.exceptions || []
  };
  if (editingId) {
    events = events.map(x => x.id === editingId ? evData : x);
  } else {
    events.push(evData);
  }
  localStorage.setItem('events', JSON.stringify(events));
  modal.style.display = 'none';
  renderCalendar(currentYear, currentMonth);
});

// Navegación de meses
prevBtn.onclick = () => { currentMonth--; updateNav(); };
nextBtn.onclick = () => { currentMonth++; updateNav(); };
function updateNav() {
  if (currentMonth < 0) { currentYear--; currentMonth = 11; }
  if (currentMonth > 11) { currentYear++; currentMonth = 0; }
  renderCalendar(currentYear, currentMonth);
}

// Iniciar
renderCalendar(currentYear, currentMonth);
