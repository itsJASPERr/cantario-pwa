// Cantario v0.2: personal lists remain device-local and work offline.
// Published lists are built from Pages CMS Markdown and are read-only in the PWA.
(() => {
  const KEY = 'cantario:lists:v1'; // preserve all existing lists and membership
  const songDialog = document.getElementById('song-lists-dialog');
  const songOptions = document.getElementById('song-lists-options');
  const songHeading = document.getElementById('manage-song-title');
  const createDialog = document.getElementById('create-list-dialog');
  const createTrigger = document.getElementById('create-list-trigger');
  const filterTrigger = document.getElementById('list-filter-trigger');
  const menu = document.getElementById('list-filter-menu');
  const picker = document.querySelector('.list-picker');
  const menuPersonal = document.getElementById('personal-list-options');
  const personalGroup = document.getElementById('local-list-menu-group');
  const menuEmpty = document.getElementById('list-menu-empty');
  const selectedName = document.getElementById('selected-list-name');
  const feedback = document.getElementById('lists-feedback');
  let activeSong = null;
  let selectedList = null;

  function read() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || '[]');
      if (!Array.isArray(data)) return [];
      return data.filter(item => item && typeof item.id === 'string' && typeof item.name === 'string')
        .map(item => ({
          id: item.id,
          name: item.name,
          songIds: Array.isArray(item.songIds)
            ? [...new Set(item.songIds.filter(id => typeof id === 'string'))]
            : []
        }));
    } catch { return []; }
  }

  function save(lists) {
    try {
      localStorage.setItem(KEY, JSON.stringify(lists));
      return true;
    } catch {
      announce('No se pudieron guardar los cambios. Revisá el espacio disponible.');
      return false;
    }
  }

  function announce(message) {
    if (feedback) feedback.textContent = message;
  }

  function nextId() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
  }

  function getPublished() {
    return [...document.querySelectorAll('[data-published-list]')].map(button => ({
      id: button.dataset.publishedList,
      name: button.dataset.listName,
      songIds: (button.dataset.songIds || '').split(',').filter(Boolean)
    }));
  }

  function getSelected() {
    if (!selectedList) return null;
    const collection = selectedList.type === 'local' ? read() : getPublished();
    const item = collection.find(list => list.id === selectedList.id);
    if (!item) selectedList = null;
    return item || null;
  }

  function publishSelection(resetMode = false) {
    const item = getSelected();
    if (selectedName) selectedName.textContent = item ? item.name : 'Listas';
    if (filterTrigger) {
      filterTrigger.classList.toggle('is-active', Boolean(item));
      filterTrigger.setAttribute('aria-label', item ? 'Lista seleccionada: ' + item.name + '. Elegir otra lista' : 'Elegir lista');
    }
    const all = document.getElementById('list-filter-none');
    if (all) all.classList.toggle('is-selected', !item);
    document.querySelectorAll('[data-published-list]').forEach(button => {
      button.classList.toggle('is-selected', selectedList?.type === 'published' && selectedList.id === button.dataset.publishedList);
    });
    document.querySelectorAll('[data-select-local-list]').forEach(button => {
      button.classList.toggle('is-selected', selectedList?.type === 'local' && selectedList.id === button.dataset.selectLocalList);
    });
    // A list selection is a mutually exclusive peer of Todas and Favoritas.
    if (filterTrigger) window.dispatchEvent(new CustomEvent('cantario:list-filter', {
      detail: {songIds: item ? [...item.songIds] : null, selected: Boolean(item), resetMode}
    }));
  }

  function makeButton(symbol, action, list, label) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'list-menu-action';
    button.dataset[action] = list.id;
    button.textContent = symbol;
    button.title = label;
    button.setAttribute('aria-label', label);
    return button;
  }

  function renderMenu() {
    if (!menuPersonal) return; // song reader uses the same script without filter UI
    menuPersonal.replaceChildren();
    const personal = read();
    if (personalGroup) personalGroup.hidden = !personal.length;
    if (menuEmpty) menuEmpty.hidden = Boolean(personal.length || getPublished().length);
    for (const list of personal) {
      const row = document.createElement('div');
      row.className = 'list-menu-row';
      const select = document.createElement('button');
      select.type = 'button';
      select.className = 'list-menu-choice';
      select.dataset.selectLocalList = list.id;
      select.setAttribute('aria-label', 'Ver lista ' + list.name);
      const name = document.createElement('span');
      name.className = 'list-menu-item-name';
      name.textContent = list.name;
      const count = document.createElement('span');
      count.className = 'list-menu-count';
      count.textContent = String(list.songIds.length);
      select.append(name, count);
      row.append(
        select,
        makeButton('✎', 'renameLocalList', list, 'Renombrar lista ' + list.name),
        makeButton('×', 'deleteLocalList', list, 'Eliminar lista ' + list.name)
      );
      menuPersonal.append(row);
    }
    publishSelection();
  }

  function renderSongOptions() {
    if (!songOptions || !activeSong) return;
    songOptions.replaceChildren();
    const personal = read();
    if (!personal.length) {
      const note = document.createElement('p');
      note.className = 'list-option-empty';
      note.textContent = 'Todavía no tenés listas personales. Creá una abajo.';
      songOptions.append(note);
      return;
    }
    for (const list of personal) {
      const label = document.createElement('label');
      label.className = 'list-checkbox-row';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = list.songIds.includes(activeSong.id);
      checkbox.setAttribute('aria-label', 'Incluir en ' + list.name);
      checkbox.addEventListener('change', () => {
        const data = read();
        const found = data.find(item => item.id === list.id);
        if (!found) return;
        if (checkbox.checked && !found.songIds.includes(activeSong.id)) found.songIds.push(activeSong.id);
        if (!checkbox.checked) found.songIds = found.songIds.filter(id => id !== activeSong.id);
        if (!save(data)) { checkbox.checked = !checkbox.checked; return; }
        render();
      });
      const name = document.createElement('span');
      name.textContent = list.name;
      label.append(checkbox, name);
      songOptions.append(label);
    }
  }

  function render() {
    renderMenu();
    renderSongOptions();
  }

  function create(name, songId = null) {
    const clean = String(name).trim().slice(0, 60);
    if (!clean) return null;
    const personal = read();
    if (personal.some(item => item.name.toLocaleLowerCase() === clean.toLocaleLowerCase())) {
      announce('Ya existe una lista con ese nombre.');
      return null;
    }
    const item = {id: nextId(), name: clean, songIds: songId ? [songId] : []};
    if (!save([...personal, item])) return null;
    announce('Lista creada: ' + clean + '. Podés agregarle canciones con el botón Lista.');
    render();
    return item;
  }

  function closeMenu(returnFocus = false) {
    if (!menu || menu.hidden) return;
    menu.hidden = true;
    if (filterTrigger) filterTrigger.setAttribute('aria-expanded', 'false');
    if (returnFocus && filterTrigger) filterTrigger.focus();
  }

  filterTrigger?.addEventListener('click', () => {
    menu.hidden = !menu.hidden;
    filterTrigger.setAttribute('aria-expanded', String(!menu.hidden));
  });

  document.addEventListener('click', event => {
    if (picker && !picker.contains(event.target)) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu && !menu.hidden) {
      event.preventDefault();
      closeMenu(true);
    }
  });

  document.getElementById('list-filter-none')?.addEventListener('click', () => {
    selectedList = null;
    publishSelection(true);
    closeMenu(true);
  });

  document.querySelectorAll('[data-published-list]').forEach(button => {
    button.addEventListener('click', () => {
      selectedList = {type: 'published', id: button.dataset.publishedList};
      publishSelection();
      closeMenu(true);
    });
  });

  menuPersonal?.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.selectLocalList) {
      selectedList = {type: 'local', id: button.dataset.selectLocalList};
      publishSelection();
      closeMenu(true);
      return;
    }
    const personal = read();
    if (button.dataset.renameLocalList) {
      const item = personal.find(list => list.id === button.dataset.renameLocalList);
      if (!item) return;
      const name = window.prompt('Nuevo nombre de la lista', item.name);
      if (name === null) return;
      const clean = name.trim().slice(0, 60);
      if (!clean) { announce('El nombre no puede estar vacío.'); return; }
      if (personal.some(list => list.id !== item.id && list.name.toLocaleLowerCase() === clean.toLocaleLowerCase())) {
        announce('Ya existe una lista con ese nombre.');
        return;
      }
      item.name = clean;
      if (save(personal)) {
        announce('Lista renombrada.');
        render();
      }
    } else if (button.dataset.deleteLocalList) {
      const item = personal.find(list => list.id === button.dataset.deleteLocalList);
      if (!item || !window.confirm('¿Eliminar la lista "' + item.name + '"? Las canciones no se eliminarán.')) return;
      if (!save(personal.filter(list => list.id !== item.id))) return;
      if (selectedList?.type === 'local' && selectedList.id === item.id) selectedList = null;
      announce('Lista eliminada.');
      render();
    }
  });

  window.addEventListener('cantario:clear-list-filter', () => {
    if (!selectedList) return;
    selectedList = null;
    publishSelection();
    closeMenu();
  });

  createTrigger?.addEventListener('click', () => {
    closeMenu();
    if (!createDialog?.showModal) return;
    createDialog.showModal();
    document.getElementById('new-list-name')?.focus();
  });
  document.getElementById('cancel-create-list')?.addEventListener('click', () => createDialog?.close());
  document.getElementById('new-list-form')?.addEventListener('submit', event => {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem('name');
    if (!input) return;
    if (create(input.value)) {
      input.value = '';
      createDialog?.close();
      createTrigger?.focus();
    }
  });

  document.querySelectorAll('[data-manage-lists]').forEach(button =>
    button.addEventListener('click', () => {
      if (!songDialog?.showModal) return;
      activeSong = {id: button.dataset.manageLists, name: button.dataset.songTitle};
      songHeading.textContent = 'Agregar a listas · ' + activeSong.name;
      renderSongOptions();
      songDialog.showModal();
    })
  );
  document.getElementById('modal-new-list-form')?.addEventListener('submit', event => {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem('name');
    if (!input) return;
    if (create(input.value, activeSong?.id)) {
      input.value = '';
      input.focus();
    }
  });
  render();
})();
