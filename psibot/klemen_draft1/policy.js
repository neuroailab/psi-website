(() => {
  const root = document.querySelector('#policy-execution-viewer');
  if (!root) return;
  const select = root.querySelector('select');
  const video = root.querySelector('video');
  const status = root.querySelector('.results-status');
  let serial = 0;

  async function loadTask() {
    const ticket = ++serial;
    video.pause();
    status.textContent = 'Loading task…';
    try {
      const response = await fetch(`../assets/results/${select.value}.json`);
      if (!response.ok) throw new Error('Could not load this policy example.');
      const task = await response.json();
      if (ticket !== serial) return;
      video.removeAttribute('poster');
      video.src = new URL(task.video, new URL('../', location.href)).href;
      video.setAttribute('aria-label', `${task.title} policy video`);
      root.dataset.task = task.id;
      video.load();
    } catch (error) {
      if (ticket === serial) status.textContent = error.message;
    }
  }

  video.addEventListener('loadedmetadata', () => {
    video.defaultPlaybackRate = 6;
    video.playbackRate = 6;
    status.textContent = '';
  });
  video.addEventListener('error', () => {
    status.textContent = 'The policy video could not load. Choose another task or reload the page.';
  });
  select.addEventListener('change', loadTask);
  loadTask();
})();
