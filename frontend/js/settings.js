document.addEventListener('DOMContentLoaded', async () => {
  const saveButton = document.getElementById('saveSettingsBtn');
  const resetButton = document.getElementById('resetSettingsBtn');
  const businessName = document.getElementById('businessName');
  const currency = document.getElementById('currency');
  const enableLowStockAlerts = document.querySelector('input[type="checkbox"]:nth-of-type(1)');
  const autoSaveSalesHistory = document.querySelector('input[type="checkbox"]:nth-of-type(2)');
  const showExpiryReminders = document.querySelector('input[type="checkbox"]:nth-of-type(3)');

  // Auto-save sales history must always be checked to prevent data loss
  if (autoSaveSalesHistory) {
    autoSaveSalesHistory.checked = true;
    autoSaveSalesHistory.disabled = true;
  }

  let lastSavedSettings = null;

  async function loadSettings() {
    try {
      const settings = await window.ShopTrackApi.request('/api/settings');
      if (businessName) businessName.value = settings.businessName || 'ShopTrack Retail';
      if (currency) currency.value = settings.currency || 'NGN';
      if (enableLowStockAlerts) enableLowStockAlerts.checked = settings.enableLowStockAlerts !== false;
      if (autoSaveSalesHistory) autoSaveSalesHistory.checked = true; // Force true
      if (showExpiryReminders) showExpiryReminders.checked = settings.showExpiryReminders !== false;
      lastSavedSettings = { ...settings };
    } catch (error) {
      console.error('Failed to load settings:', error);
      lastSavedSettings = {
        businessName: 'ShopTrack Retail',
        currency: 'NGN',
        enableLowStockAlerts: true,
        autoSaveSalesHistory: true,
        showExpiryReminders: true
      };
    }
  }

  function showMessage(message, isError = false) {
    const container = saveButton.closest('section');
    if (!container) return;
    const existing = container.querySelector('.form-message');
    if (existing) existing.remove();
    const messageEl = document.createElement('div');
    messageEl.className = `form-message ${isError ? 'error' : 'success'}`;
    messageEl.textContent = message;
    container.appendChild(messageEl);
  }

  if (saveButton) {
    saveButton.addEventListener('click', async () => {
      const payload = {
        businessName: businessName ? businessName.value.trim() || 'ShopTrack Retail' : 'ShopTrack Retail',
        currency: currency ? currency.value : 'NGN',
        enableLowStockAlerts: enableLowStockAlerts ? enableLowStockAlerts.checked : true,
        autoSaveSalesHistory: true, // Always true - cannot be disabled
        showExpiryReminders: showExpiryReminders ? showExpiryReminders.checked : true
      };

      try {
        const response = await window.ShopTrackApi.request('/api/settings', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        lastSavedSettings = { ...payload };
        showMessage(`Settings saved for ${payload.businessName}.`);
      } catch (error) {
        showMessage(`Failed to save settings: ${error.message}`, true);
      }
    });
  }

  if (resetButton) {
    resetButton.addEventListener('click', async () => {
      if (lastSavedSettings) {
        // Restore last saved values
        if (businessName) businessName.value = lastSavedSettings.businessName || 'ShopTrack Retail';
        if (currency) currency.value = lastSavedSettings.currency || 'NGN';
        if (enableLowStockAlerts) enableLowStockAlerts.checked = lastSavedSettings.enableLowStockAlerts !== false;
        if (autoSaveSalesHistory) autoSaveSalesHistory.checked = true;
        if (showExpiryReminders) showExpiryReminders.checked = lastSavedSettings.showExpiryReminders !== false;
        showMessage('Settings restored to last saved values.');
      } else {
        // Fallback: reload from API
        await loadSettings();
        showMessage('Settings reset to defaults.');
      }
    });
  }

  await loadSettings();
});
