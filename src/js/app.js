// Simple Kanban app with localStorage + drag/drop
const COLUMNS = ['Backlog','To Do','In Progress','Done'];
const STORAGE_KEY = 'flowboard:v1';

let state = { columns: {} };
const boardEl = document.getElementById('board');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const addCardBtn = document.getElementById('addCardBtn');
const saveCardBtn = document.getElementById('saveCard');
const cancelBtn = document.getElementById('cancel');
const titleInput = document.getElementById('cardTitle');
const descInput = document.getElementById('cardDesc');
const assigneeInput = document.getElementById('cardAssignee');
const searchInput = document.getElementById('search');

let editing = null; // {col, id} or null
let dragged = null;

function uid(){ return 'c_'+Math.random().toString(36).slice(2,9); }

function load(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(raw) state = JSON.parse(raw);
  else {
    // initialize
    COLUMNS.forEach(c => state.columns[c] = []);
    // sample card
    state.columns['Backlog'].push({id:uid(), title:'Welcome to FlowBoard', desc:'Drag me to different columns', assignee:'Team'});
    save();
  }
}

function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

function render(){
  boardEl.innerHTML = '';
  COLUMNS.forEach(colName => {
    const tpl = document.getElementById('column-template').content.cloneNode(true);
    const section = tpl.querySelector('.column');
    tpl.querySelector('.col-title').textContent = colName;
    const list = tpl.querySelector('.col-list');
    list.dataset.col = colName;

    // allow dropping
    list.addEventListener('dragover', e => {
      e.preventDefault();
      const after = getDragAfterElement(list, e.clientY);
      const draggingEl = document.querySelector('.dragging');
      if(after == null) list.appendChild(draggingEl);
      else list.insertBefore(draggingEl, after);
    });
    list.addEventListener('drop', e => {
      e.preventDefault();
      const cardEl = document.querySelector('.card.dragging');
      if(!cardEl) return;
      const cardId = cardEl.dataset.id;
      // remove from old col
      removeCardFromState(cardId);
      // insert into new col at index
      const col = list.dataset.col;
      // find index
      const nodes = Array.from(list.children).filter(n => n.classList.contains('card'));
      const index = nodes.indexOf(cardEl);
      state.columns[col].splice(index, 0, getCardFromElement(cardEl));
      save(); render();
    });

    // populate cards
    (state.columns[colName] || []).forEach(card => {
      const cardEl = createCardElement(card);
      list.appendChild(cardEl);
    });

    boardEl.appendChild(tpl);
  });
}

function createCardElement(card){
  const el = document.createElement('article');
  el.className = 'card';
  el.draggable = true;
  el.dataset.id = card.id;
  el.innerHTML = `<h4>${escapeHtml(card.title)}</h4><p>${escapeHtml(card.desc||'')}</p>
    <div class="meta"><span>${escapeHtml(card.assignee||'')}</span>
    <span><button class="edit">Edit</button> <button class="del">Delete</button></span></div>`;

  el.addEventListener('dragstart', e => {
    dragged = card.id;
    el.classList.add('dragging');
  });
  el.addEventListener('dragend', e => {
    dragged = null;
    el.classList.remove('dragging');
  });

  el.querySelector('.edit').addEventListener('click', () => openEdit(card));
  el.querySelector('.del').addEventListener('click', () => {
    if(confirm('Delete this card?')) {
      deleteCard(card.id);
    }
  });
  return el;
}

function getCardFromElement(el){
  const id = el.dataset.id;
  // find the card object from state
  for(const col of COLUMNS){
    const arr = state.columns[col];
    const found = arr.find(c=>c.id===id);
    if(found) return found;
  }
  // fallback — create minimal
  return { id, title:el.querySelector('h4')?.textContent||'', desc:el.querySelector('p')?.textContent||'', assignee:'' };
}

function removeCardFromState(cardId){
  for(const col of COLUMNS){
    const arr = state.columns[col];
    const idx = arr.findIndex(c=>c.id===cardId);
    if(idx!==-1) { arr.splice(idx,1); return true; }
  }
  return false;
}

function getDragAfterElement(container, y){
  const draggableElements = [...container.querySelectorAll('.card:not(.dragging)')];
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height/2;
    if(offset < 0 && offset > (closest.offset || -Infinity)) {
      return { offset, element: child };
    } else return closest;
  }, { offset: -Infinity }).element || null;
}

function openEdit(card){
  editing = findCardLocation(card.id);
  modalTitle.textContent = 'Edit Card';
  titleInput.value = card.title;
  descInput.value = card.desc || '';
  assigneeInput.value = card.assignee || '';
  showModal();
}

function findCardLocation(id){
  for(const col of COLUMNS){
    const idx = state.columns[col].findIndex(c=>c.id===id);
    if(idx!==-1) return { col, idx };
  }
  return null;
}

function deleteCard(id){
  removeCardFromState(id);
  save();
  render();
}

function showModal(){
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden','false');
  titleInput.focus();
}
function hideModal(){
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden','true');
  editing = null;
  titleInput.value=''; descInput.value=''; assigneeInput.value='';
}

addCardBtn.addEventListener('click', () => {
  editing = null;
  modalTitle.textContent = 'Add Card';
  showModal();
});
cancelBtn.addEventListener('click', hideModal);

saveCardBtn.addEventListener('click', () => {
  const t = titleInput.value.trim();
  if(!t){ alert('Title required'); return; }
  const card = { id: editing ? state.columns[editing.col][editing.idx].id : uid(), title: t, desc: descInput.value.trim(), assignee: assigneeInput.value.trim() };
  if(editing){
    state.columns[editing.col][editing.idx] = card;
  } else {
    state.columns['Backlog'].push(card);
  }
  save();
  hideModal();
  render();
});

searchInput.addEventListener('input', () => {
  const q = searchInput.value.trim().toLowerCase();
  document.querySelectorAll('.card').forEach(cardEl => {
    const text = (cardEl.innerText || '').toLowerCase();
    cardEl.style.display = text.includes(q) ? '' : 'none';
  });
});

function escapeHtml(s=''){ return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

function findCardLocation(cardId){
  for(const col of COLUMNS){
    const idx = state.columns[col].findIndex(c => c.id === cardId);
    if(idx !== -1) return { col, idx };
  }
  return null;
}

function init(){
  load();
  render();
  // keyboard: close modal on ESC
  document.addEventListener('keydown', e => { if(e.key==='Escape') hideModal(); });
}
init();
