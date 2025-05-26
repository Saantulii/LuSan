// DOM refs
const modal         = document.getElementById('log-modal');
const cancelBtn     = document.getElementById('cancel-log');
const form          = document.getElementById('log-form');
const calendar      = document.getElementById('calendar-grid');
const monthDisp     = document.getElementById('month-display');
const prevBtn       = document.getElementById('prev-month');
const nextBtn       = document.getElementById('next-month');
const useCondom     = document.getElementById('use-condom');
const noCondomDiv   = document.getElementById('no-condom-options');
const modalTitle    = document.getElementById('modal-title');
const saveBtn       = document.getElementById('save-log');

let today = new Date(),
    cy    = today.getFullYear(),
    cm    = today.getMonth(),
    logs  = JSON.parse(localStorage.getItem('intimoLogs')||'[]'),
    editingIndex = null;

// Mostrar/ocultar campo adentro/afuera
useCondom.addEventListener('change', () => {
  if (useCondom.value === 'no') {
    noCondomDiv.style.display = 'block';
  } else {
    noCondomDiv.style.display = 'none';
    document.getElementById('no-condom-location').value = '';
  }
});

// Render del calendario
function renderCalendar(year, month) {
  monthDisp.textContent = new Date(year, month)
    .toLocaleString('en-US',{month:'long'}).replace(/^\w/,c=>c.toUpperCase());
  while (calendar.children.length > 7) calendar.removeChild(calendar.lastChild);

  const firstDay = new Date(year,month,1).getDay(),
        dim      = new Date(year,month+1,0).getDate();

  for (let i=0;i<firstDay;i++){
    const e=document.createElement('div');
    e.classList.add('day');
    calendar.appendChild(e);
  }
  for (let d=1; d<=dim; d++){
    const cell = document.createElement('div');
    cell.classList.add('day');
    const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    cell.dataset.date = ds;
    cell.innerHTML = `<span class="number">${d}</span>`;
    cell.addEventListener('click', () => openModal(ds));

    // renderizar logs del día
    logs.forEach((l, idx) => {
      if (l.date === ds) {
        const ev = document.createElement('span');
        ev.classList.add('event');
        ev.textContent = (l.useCondom==='yes' ? '🛡️' : '🔥');
        ev.addEventListener('click', e => {
          e.stopPropagation();
          openModal(ds, idx);
        });
        cell.appendChild(ev);
      }
    });

    // indicador de actividad
    if (cell.querySelector('.event')) {
      const h = document.createElement('span');
      h.classList.add('day-heart');
      h.textContent = '❤️';
      cell.appendChild(h);
    }
    calendar.appendChild(cell);
  }
}

// Abrir modal: nuevo o editar
function openModal(dateStr, idx=null) {
  form.reset();
  noCondomDiv.style.display = 'none';
  editingIndex = idx;
  document.getElementById('evt-date').value = dateStr;

  if (idx !== null) {
    const l = logs[idx];
    modalTitle.textContent = 'Editar Registro';
    saveBtn.textContent = 'Actualizar';
    document.getElementById('evt-id').value = l.id;
    useCondom.value           = l.useCondom;
    if (l.useCondom==='no') noCondomDiv.style.display = 'block';
    document.getElementById('no-condom-location').value = l.noCondomLocation || '';
    document.getElementById('times-today').value       = l.times;
    document.getElementById('male-orgasm').value       = l.maleOrg;
    document.getElementById('female-orgasm').value     = l.femaleOrg;
    document.getElementById('use-toys').value          = l.useToys;
    document.getElementById('intimacy-level').value    = l.intimacyLevel;
    document.getElementById('recovery-time').value     = l.recoveryTime;
    document.getElementById('notes').value             = l.notes;
  } else {
    modalTitle.textContent = 'Nuevo Registro Íntimo';
    saveBtn.textContent = 'Guardar';
  }

  modal.style.display = 'flex';
}

cancelBtn.onclick = () => modal.style.display = 'none';

// Manejar envío (crear o actualizar)
form.onsubmit = e => {
  e.preventDefault();
  const f = new FormData(form);
  const record = {
    id:                f.get('evt-id') || Date.now(),
    date:              f.get('evt-date'),
    useCondom:         f.get('use-condom'),
    noCondomLocation:  f.get('no-condom-location'),
    times:             f.get('times-today'),
    maleOrg:           f.get('male-orgasm'),
    femaleOrg:         f.get('female-orgasm'),
    useToys:           f.get('use-toys'),
    intimacyLevel:     f.get('intimacy-level'),
    recoveryTime:      f.get('recovery-time'),
    notes:             f.get('notes')
  };

  if (editingIndex !== null) {
    logs[editingIndex] = record;
  } else {
    logs.push(record);
  }

  localStorage.setItem('intimoLogs', JSON.stringify(logs));
  modal.style.display = 'none';
  renderCalendar(cy,cm);
};

// Navegación de meses
prevBtn.onclick = () => { cm--; nav(); };
nextBtn.onclick = () => { cm++; nav(); };
function nav() {
  if (cm<0) { cy--; cm=11; }
  if (cm>11){ cy++; cm=0; }
  renderCalendar(cy,cm);
}

// Iniciar
renderCalendar(cy,cm);
