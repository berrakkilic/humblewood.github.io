/** Persistent music catalog and synchronized jukebox controls. */

// ================= JUKEBOX =================
const audioEl = document.getElementById('audio-el');
const trackPresetSelect = document.getElementById('track-preset-select');
const trackTitleInput = document.getElementById('track-title');
const trackUrlInput = document.getElementById('track-url');
const trackFileInput = document.getElementById('track-file');
const addTrackButton = document.getElementById('add-track-btn');
const jukeboxVolumeInput = document.getElementById('jukebox-volume');
const jukeboxVolumeValue = document.getElementById('jukebox-volume-value');
const jukeboxVolumeIcon = document.getElementById('jukebox-volume-icon');
const JUKEBOX_VOLUME_STORAGE_KEY = 'humblewood:jukebox-volume';
let availableMusicTracks = [];

function normalizedJukeboxVolume(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(0, Math.min(100, Math.round(numeric))) : 100;
}

function storedJukeboxVolume() {
  try {
    const stored = localStorage.getItem(JUKEBOX_VOLUME_STORAGE_KEY);
    return stored === null ? 100 : normalizedJukeboxVolume(stored);
  } catch {
    return 100;
  }
}

function applyLocalJukeboxVolume(value, persist = false) {
  const percent = normalizedJukeboxVolume(value);
  audioEl.volume = percent / 100;
  jukeboxVolumeInput.value = String(percent);
  jukeboxVolumeInput.setAttribute('aria-valuetext', `${percent} percent`);
  jukeboxVolumeValue.textContent = `${percent}%`;
  jukeboxVolumeIcon.textContent = percent === 0 ? '🔇' : percent < 50 ? '🔉' : '🔊';
  if (persist) {
    try { localStorage.setItem(JUKEBOX_VOLUME_STORAGE_KEY, String(percent)); } catch {}
  }
}

applyLocalJukeboxVolume(storedJukeboxVolume());
jukeboxVolumeInput.addEventListener('input', () => applyLocalJukeboxVolume(jukeboxVolumeInput.value, true));
window.addEventListener('storage', event => {
  if (event.key === JUKEBOX_VOLUME_STORAGE_KEY && event.newValue !== null) {
    applyLocalJukeboxVolume(event.newValue);
  }
});

function renderMusicTrackOptions() {
  trackPresetSelect.innerHTML = '<option value="">Choose an existing track…</option>';
  availableMusicTracks.forEach((track, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = `${track.title} · ${track.source}`;
    trackPresetSelect.appendChild(option);
  });
}

async function loadMusicTracks() {
  try {
    const response = await fetch('/api/music');
    if (!response.ok) throw new Error('Music list unavailable');
    const payload = await response.json();
    availableMusicTracks = Array.isArray(payload.tracks) ? payload.tracks : [];
    renderMusicTrackOptions();
  } catch (error) {
    availableMusicTracks = [];
    renderMusicTrackOptions();
  }
}

trackPresetSelect.onchange = () => {
  if (!trackPresetSelect.value) return;
  const track = availableMusicTracks[Number(trackPresetSelect.value)];
  if (!track) return;
  trackTitleInput.value = track.title;
  trackUrlInput.value = track.url;
  trackFileInput.value = '';
};

trackFileInput.onchange = () => {
  const file = trackFileInput.files[0];
  if (!file) return;
  const selectedPreset = trackPresetSelect.value
    ? availableMusicTracks[Number(trackPresetSelect.value)]
    : null;
  trackPresetSelect.value = '';
  trackUrlInput.value = '';
  if (!trackTitleInput.value.trim() || selectedPreset?.title === trackTitleInput.value.trim()) {
    trackTitleInput.value = file.name.replace(/\.mp3$/i, '').replace(/[_-]+/g, ' ');
  }
};

addTrackButton.onclick = async () => {
  const file = trackFileInput.files[0];
  let title = trackTitleInput.value.trim();
  let url = trackUrlInput.value.trim();
  if (!file && !url) return alert('Choose an existing track, upload an MP3, or add an audio URL.');
  addTrackButton.disabled = true;
  try {
    if (file) {
      const uploaded = await uploadAudioFile(file);
      url = uploaded.url;
      if (!title) title = uploaded.name.replace(/\.mp3$/i, '').replace(/[_-]+/g, ' ');
    }
    if (!title) return alert('Give the track a name.');
    const existingIndex = state.jukebox.playlist.findIndex(track => track.url === url);
    const playlist = existingIndex === -1
      ? [...state.jukebox.playlist, { id: 'm' + Date.now(), title, url }]
      : state.jukebox.playlist.map((track, index) => index === existingIndex ? { ...track, title } : track);
    socket.emit('jukebox:setPlaylist', playlist);
    trackTitleInput.value = '';
    trackUrlInput.value = '';
    trackFileInput.value = '';
    trackPresetSelect.value = '';
    if (file) {
      await loadMusicTracks();
      showToast(existingIndex === -1 ? 'Track saved on the server.' : 'Server track restored.');
    }
  } catch (error) {
    alert(error.message || 'The MP3 could not be uploaded.');
  } finally {
    addTrackButton.disabled = false;
  }
};

loadMusicTracks();

document.getElementById('jb-playpause').onclick = () => {
  if (state.jukebox.isPlaying) {
    socket.emit('jukebox:pause');
  } else if (state.jukebox.currentIndex === -1 && state.jukebox.playlist.length) {
    socket.emit('jukebox:play', { index: 0 });
  } else {
    socket.emit('jukebox:resume');
  }
};
document.getElementById('jb-next').onclick = () => {
  const next = (state.jukebox.currentIndex + 1) % Math.max(1, state.jukebox.playlist.length);
  socket.emit('jukebox:play', { index: next });
};
document.getElementById('jb-prev').onclick = () => {
  const prev = (state.jukebox.currentIndex - 1 + state.jukebox.playlist.length) % Math.max(1, state.jukebox.playlist.length);
  socket.emit('jukebox:play', { index: prev });
};

function renderJukebox() {
  const j = state.jukebox;
  const list = document.getElementById('playlist');
  list.innerHTML = '';
  j.playlist.forEach((track, i) => {
    const row = document.createElement('div');
    row.className = 'playlist-item' + (i === j.currentIndex ? ' playing' : '');
    row.innerHTML = `<span>${i === j.currentIndex ? '🎶 ' : ''}${escapeHtml(track.title)}</span><span class="del dm-only">×</span>`;
    row.querySelector('span').onclick = () => socket.emit('jukebox:play', { index: i });
    row.querySelector('.del').onclick = (e) => {
      e.stopPropagation();
      const playlist = j.playlist.filter((_, idx) => idx !== i);
      socket.emit('jukebox:setPlaylist', playlist);
    };
    list.appendChild(row);
  });

  const current = j.playlist[j.currentIndex];
  document.getElementById('now-playing').textContent = current ? current.title : 'Nothing playing';
  document.getElementById('now-playing-sub').textContent = current ? 'from the Humblewood jukebox' : 'add a track below to begin';
  document.getElementById('jukebox-art').classList.toggle('spinning', j.isPlaying);
  document.getElementById('jb-playpause').textContent = j.isPlaying ? '⏸' : '▶';

  if (current) {
    if (audioEl.src !== location.origin + current.url && audioEl.src !== current.url) {
      audioEl.src = current.url;
    }
    const elapsed = j.isPlaying ? (Date.now() - j.startedAt) / 1000 : j.seek;
    if (Math.abs((audioEl.currentTime || 0) - elapsed) > 1.5) {
      audioEl.currentTime = elapsed;
    }
    if (j.isPlaying) audioEl.play().catch(() => {}); else audioEl.pause();
  } else {
    audioEl.pause();
    audioEl.removeAttribute('src');
  }
}

audioEl.onended = () => {
  if (state.jukebox.playlist.length > 1) {
    document.getElementById('jb-next').click();
  } else {
    socket.emit('jukebox:pause');
  }
};
