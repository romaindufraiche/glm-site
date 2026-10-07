(() => {
  const { urlPattern, existing } = window.GLM_ADMIN;
  const form = document.getElementById('deployForm');
  const clientInput = document.getElementById('clientInput');
  const slugInput = document.getElementById('slugInput');
  const urlPreview = document.getElementById('urlPreview');
  const replaceBadge = document.getElementById('replaceBadge');
  const archiveInput = document.getElementById('archiveInput');
  const dropzone = document.getElementById('dropzone');
  const dzText = document.getElementById('dzText');
  const deployBtn = document.getElementById('deployBtn');
  const progress = document.getElementById('progress');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');

  const slugify = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/, '');

  /* Identifiant + aperçu du lien */
  let slugTouched = false;
  function refreshPreview() {
    const slug = slugInput.value || '…';
    urlPreview.textContent = urlPattern.replace('{slug}', slug);
    replaceBadge.hidden = !existing.includes(slugInput.value);
  }
  clientInput.addEventListener('input', () => {
    if (!slugTouched) slugInput.value = slugify(clientInput.value);
    refreshPreview();
  });
  slugInput.addEventListener('input', () => {
    slugTouched = slugInput.value !== '';
    slugInput.value = slugInput.value.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    refreshPreview();
  });

  /* Zone de dépôt */
  function showFile() {
    const f = archiveInput.files[0];
    dzText.textContent = f ? `${f.name} — ${(f.size / 1048576).toFixed(1)} Mo` : "Glissez l'archive .zip ici ou parcourez";
    dropzone.classList.toggle('has-file', !!f);
  }
  archiveInput.addEventListener('change', showFile);
  ['dragenter', 'dragover'].forEach((t) => dropzone.addEventListener(t, (e) => { e.preventDefault(); dropzone.classList.add('drag'); }));
  ['dragleave', 'drop'].forEach((t) => dropzone.addEventListener(t, (e) => { e.preventDefault(); dropzone.classList.remove('drag'); }));
  dropzone.addEventListener('drop', (e) => {
    if (e.dataTransfer.files.length) { archiveInput.files = e.dataTransfer.files; showFile(); }
  });

  /* Envoi avec barre de progression ; le serveur redirige vers le tableau de bord avec le message. */
  form.addEventListener('submit', (e) => {
    if (!form.checkValidity()) return;
    if (!replaceBadge.hidden && !confirm(`Remplacer la démo actuelle « ${slugInput.value} » par cette nouvelle version ?`)) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    const xhr = new XMLHttpRequest();
    xhr.open('POST', form.action);
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    xhr.upload.addEventListener('progress', (ev) => {
      if (!ev.lengthComputable) return;
      const pct = Math.round((ev.loaded / ev.total) * 100);
      progressBar.style.width = pct + '%';
      progressText.textContent = pct < 100 ? `Envoi… ${pct} %` : 'Décompression et mise en ligne…';
    });
    xhr.addEventListener('loadend', () => { window.location.href = './'; });
    deployBtn.disabled = true;
    progress.hidden = false;
    xhr.send(new FormData(form));
  });

  /* Actions sur les démos existantes */
  document.addEventListener('click', async (e) => {
    const copyBtn = e.target.closest('[data-copy]');
    if (copyBtn) {
      try {
        await navigator.clipboard.writeText(copyBtn.dataset.copy);
        const label = copyBtn.textContent;
        copyBtn.textContent = 'Lien copié ✓';
        setTimeout(() => { copyBtn.textContent = label; }, 1600);
      } catch (err) {
        prompt('Copiez le lien :', copyBtn.dataset.copy);
      }
    }
    const updateBtn = e.target.closest('[data-update]');
    if (updateBtn) {
      clientInput.value = updateBtn.dataset.client;
      slugInput.value = updateBtn.dataset.update;
      slugTouched = true;
      refreshPreview();
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      archiveInput.click();
    }
  });
  document.querySelectorAll('form[data-confirm]').forEach((f) => {
    f.addEventListener('submit', (e) => { if (!confirm(f.dataset.confirm)) e.preventDefault(); });
  });

  refreshPreview();
})();
