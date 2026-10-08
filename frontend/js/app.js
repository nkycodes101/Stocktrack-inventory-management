// Shared frontend behavior for the ShopTrack dashboard.
window.ShopTrackApi = {
  baseUrl: 'http://127.0.0.1:5000',

  async request(path, options = {}) {
    const url = path.startsWith('http') ? path : `${this.baseUrl}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const payload = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const message = typeof payload === 'string' ? payload : payload?.error || 'The request failed.';
      throw new Error(message);
    }

    return payload;
  },
};

document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  const workspaceSelector = document.getElementById('workspaceSelector');

  if (workspaceSelector) {
    const storageKey = 'shoptrack-workspace';
    const savedWorkspace = localStorage.getItem(storageKey);

    if (savedWorkspace && Array.from(workspaceSelector.options).some((option) => option.value === savedWorkspace)) {
      workspaceSelector.value = savedWorkspace;
    }

    const updateWorkspaceLabel = () => {
      document.querySelectorAll('[data-workspace-label]').forEach((label) => {
        label.textContent = `Workspace: ${workspaceSelector.value}`;
      });
    };

    workspaceSelector.addEventListener('change', () => {
      localStorage.setItem(storageKey, workspaceSelector.value);
      updateWorkspaceLabel();
    });

    updateWorkspaceLabel();
  }

  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });

    document.addEventListener('click', (event) => {
      const screenWidth = window.innerWidth;
      const clickedInsideSidebar = sidebar.contains(event.target);
      const clickedToggle = menuToggle.contains(event.target);

      if (screenWidth <= 820 && !clickedInsideSidebar && !clickedToggle) {
        sidebar.classList.remove('open');
      }
    });
  }
});
