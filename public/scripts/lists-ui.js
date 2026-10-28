// Local, device-only lists. Published lists come from Pages CMS and are read-only here.
(() => {
  const KEY = 'cantario:lists:v1';
  const grid = document.getElementById('personal-list-grid');
  const dialog = document.getElementById('song-lists-dialog');
  const listOptions = document.getElementById('song-lists-options');
  const heading = document.getElementById('manage-song-title');
  const feedback = document.getElementById('lists-feedback');
  const filterLabel = document.getElementById('active-list-label');
  const clearFilter = document.getElementById('clear-list-filter');
  let activeSong = null;
  let selectedList = null;

  function read() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || '[]');
      if (!Array.isArray(data)) return [];
      return data.filter(item => item && typeof item.id === 'string' && typeof item.name === 'string')
        .map(item => ({id: item.id, name: item.name, songIds: Array.isArray(item.songIds) ? [...new Set(item.songIds.filter(x => typeof x === 'string'))] : []}));
    } catch { return []; }
  }
  function save(lists) {
    try {
      localStorage.setItem(KEY, JSON.stringify(lists));
      return true;
    } catch {
      if (feedback) feedback.textContent = 'No pudimos guardar los cambios en este dispositivo. Revisá el almacenamiento del navegador.';
      return false;
    }
  }
  function nextId() {
    if (crypto?.randomUUID) return crypto.randomUUID();
    return String(Date.now()) + '-' + Math.random().toString(36).slice(2);
  }
  function emitSelection() {
    let ids = null, label = '';
    if (selectedList) {
      const list = selectedList.type === 'local'
        ? read().find(item => item.id === selectedList.id)
        : getPublished().find(item => item.id === selectedList.id);
      if (list) {
        ids = [...list.songIds];
        label = list.name;
      } else selectedList = null;
    }
    if (filterLabel && clearFilter) {
      filterLabel.textContent = label ? 'Lista: ' + label : '';
      clearFilter.hidden = !label;
    }
    document.querySelectorAll('[data-published-list]').forEach(button => {
      button.classList.toggle('is-selected', selectedList?.type === 'published' && selectedList.id === button.dataset.publishedList);
    });
    document.querySelectorAll('[data-open-local-list]').forEach(button => {
      button.classList.toggle('is-selected', selectedList?.type === 'local' && selectedList.id === button.dataset.openLocalList);
    });
    window.dispatchEvent(new CustomEvent('cantario:list-filter', { detail: { songIds: ids } }));
  }
  function getPublished() {
    return [...document.querySelectorAll('[data-published-list]')].map(button => ({
      id: button.dataset.publishedList,
      name: button.dataset.listName,
      songIds: (button.dataset.songIds || '').split(',').filter(Boolean)
    }));
  }
  function announce(message) {
    if (feedback) feedback.textContent = message;
  }
  function makeButton(label, className, action, id, title) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = className;
    b.textContent = label;
    b.dataset[action] = id;
    if (title) b.setAttribute('aria-label', title);
    return b;
  }
  function render() {
    if (grid) {
      grid.replaceChildren();
      const lists = read();
      document.getElementById('local-list-empty').hidden = lists.length !== 0;
      for (const list of lists) {
        const card = document.createElement('div');
        card.className = 'list-tile local-list-tile';
        const title = makeButton(list.name, 'list-tile-main', 'openLocalList', list.id, 'Ver lista ' + list.name);
        const number = document.createElement('small');
        number.textContent = list.songIds.length + (list.songIds.length === 1 ? ' canción' : ' canciones');
        title.append(number);
        const actions = document.createElement('div');
        actions.className = 'list-actions';
        actions.append(
          makeButton('Editar', 'list-action', 'renameList', list.id, 'Renombrar lista ' + list.name),
          makeButton('×', 'list-action delete-list', 'deleteList', list.id, 'Eliminar lista ' + list.name)
        );
        card.append(title, actions);
        grid.append(card);
      }
    }
    renderModal();
    emitSelection();
  }
  function create(name, songId = null) {
    const clean = name.trim().slice(0, 60);
    if (!clean) return;
    const lists = read();
    const item = {id: nextId(), name: clean, songIds: songId ? [songId] : []};
    if (!save([...lists,item])) return;
    announce('Lista creada: ' + clean);
    render();
    return item;
  }
  function renderModal() {
    if (!listOptions || !activeSong) return;
    listOptions.replaceChildren();
    const lists = read();
    if (!lists.length) {
      const note = document.createElement('p');
      note.className = 'list-option-empty';
      note.textContent = 'Todavía no tenés listas personales. Creá una abajo.';
      listOptions.append(note);
      return;
    }
    for (const list of lists) {
      const label = document.createElement('label');
      label.className = 'list-checkbox-row';
      const check = document.createElement('input');
      check.type = 'checkbox';
      check.checked = list.songIds.includes(activeSong.id);
      check.addEventListener('change', () => {
        const current = read();
        const found = current.find(item => item.id === list.id);
        if (!found) return;
        if (check.checked && !found.songIds.includes(activeSong.id)) found.songIds.push(activeSong.id);
        if (!check.checked) found.songIds = found.songIds.filter(id => id !== activeSong.id);
        if (!save(current)) { check.checked = !check.checked; return; }
        render();
      });
      const text = document.createElement('span');
      text.textContent = list.name;
      label.append(check,text);
      listOptions.append(label);
    }
  }
  document.querySelectorAll('[data-manage-lists]').forEach(button =>
    button.addEventListener('click', () => {
      if (!dialog?.showModal) { alert('Tu navegador no admite esta opción.'); return; }
      activeSong = {id:button.dataset.manageLists, name:button.dataset.songTitle};
      heading.textContent = 'Agregar a listas · ' + activeSong.name;
      renderModal();
      dialog.showModal();
    })
  );
  document.getElementById('new-list-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const input = e.currentTarget.querySelector('input[name="name"]');
    if (create(input.value)) { input.value = ''; input.focus(); }
  });
  document.getElementById('modal-new-list-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const input = e.currentTarget.querySelector('input[name="name"]');
    if (create(input.value, activeSong?.id)) { input.value = ''; input.focus(); }
  });
  document.querySelectorAll('[data-published-list]').forEach(button =>
    button.addEventListener('click', () => {
      const id = button.dataset.publishedList;
      selectedList = selectedList?.type === 'published' && selectedList.id === id ? null : {type:'published',id};
      emitSelection();
      document.querySelector('.library')?.scrollIntoView({behavior:'smooth',block:'start'});
    })
  );
  grid?.addEventListener('click', event => {
    const target = event.target.closest('button');
    if (!target) return;
    const lists = read();
    if (target.dataset.openLocalList) {
      const id = target.dataset.openLocalList;
      selectedList = selectedList?.type === 'local' && selectedList.id === id ? null : {type:'local',id};
      emitSelection();
      document.querySelector('.library')?.scrollIntoView({behavior:'smooth',block:'start'});
    } else if (target.dataset.renameList) {
      const item = lists.find(item => item.id === target.dataset.renameList);
      if (!item) return;
      const name = prompt('Nuevo nombre de la lista', item.name);
      if (name === null) return;
      if (!name.trim()) { announce('El nombre no puede estar vacío.'); return; }
      item.name = name.trim().slice(0,60);
      if (save(lists)) { announce('Lista renombrada.'); render(); }
    } else if (target.dataset.deleteList) {
      const item = lists.find(item => item.id === target.dataset.deleteList);
      if (!item || !confirm('¿Eliminar la lista "' + item.name + '"? Las canciones no se eliminarán.')) return;
      if (!save(lists.filter(list => list.id !== item.id))) return;
      if (selectedList?.type === 'local' && selectedList.id === item.id) selectedList = null;
      announce('Lista eliminada.');
      render();
    }
  });
  clearFilter?.addEventListener('click', () => {selectedList=null;emitSelection()});
  render();
})();
