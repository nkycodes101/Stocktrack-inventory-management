let customers = [];

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

async function loadCustomers() {
  try {
    customers = (await window.ShopTrackApi.request('/api/customers')) || [];
    renderCustomers();
  } catch (error) {
    const body = document.getElementById('customersTableBody');
    if (body) {
      body.innerHTML = '<tr><td colspan="6">Unable to load customers.</td></tr>';
    }
    console.error(error);
  }
}

function renderCustomers() {
  const tableBody = document.getElementById('customersTableBody');
  const searchInput = document.getElementById('customerSearch');
  const nameInput = document.getElementById('customerNameInput');
  const phoneInput = document.getElementById('customerPhoneInput');

  if (!tableBody) return;

  const searchText = (searchInput?.value || '').trim().toLowerCase();
  const filterName = (nameInput?.value || '').trim().toLowerCase();
  const filterPhone = (phoneInput?.value || '').trim().toLowerCase();

  const filteredCustomers = customers.filter((customer) => {
    const name = String(customer.name || '').toLowerCase();
    const phone = String(customer.phone || '').toLowerCase();
    const matchesText = !searchText || name.includes(searchText) || phone.includes(searchText);
    const matchesName = !filterName || name.includes(filterName);
    const matchesPhone = !filterPhone || phone.includes(filterPhone);
    return matchesText && matchesName && matchesPhone;
  });

  tableBody.innerHTML = filteredCustomers
    .map(
      (customer) => `
        <tr>
          <td>${customer.name}</td>
          <td>${customer.phone || '—'}</td>
          <td>${customer.totalPurchases ?? 0}</td>
          <td>${formatCurrency(customer.amountOwed ?? customer.totalOwing ?? 0)}</td>
          <td>${customer.lastPurchase || '—'}</td>
          <td><button type="button" class="table-action customer-view-btn" data-customer-id="${customer.id}">View</button></td>
        </tr>
      `
    )
    .join('');
}

function openCustomerModal() {
  const modal = document.getElementById('customerModal');
  const form = document.getElementById('customerForm');
  const message = document.getElementById('customerFormMessage');

  if (!modal || !form) return;

  form.reset();
  message.textContent = '';
  message.className = 'form-message';

  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  document.getElementById('customerNameField').focus();
}

function closeCustomerModal() {
  const modal = document.getElementById('customerModal');
  const form = document.getElementById('customerForm');
  const message = document.getElementById('customerFormMessage');

  if (!modal || !form) return;

  form.reset();
  message.textContent = '';
  message.className = 'form-message';
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
}

function validateCustomerForm() {
  const nameField = document.getElementById('customerNameField');
  const phoneField = document.getElementById('customerPhoneField');

  if (!nameField || !nameField.value || !nameField.value.trim()) {
    return 'Customer name is required.';
  }

  if (!phoneField || !phoneField.value || !phoneField.value.trim()) {
    return 'Phone number is required.';
  }

  return null;
}

async function saveCustomer(event) {
  event.preventDefault();

  const message = document.getElementById('customerFormMessage');
  const validationError = validateCustomerForm();

  if (validationError) {
    message.textContent = validationError;
    message.className = 'form-message error';
    return;
  }

  const payload = {
    name: document.getElementById('customerNameField').value.trim(),
    phone: document.getElementById('customerPhoneField').value.trim(),
  };

  try {
    await window.ShopTrackApi.request('/api/customers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    await loadCustomers();
    closeCustomerModal();
  } catch (error) {
    message.textContent = error.message;
    message.className = 'form-message error';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const openCustomerModalBtn = document.getElementById('openCustomerModalBtn');
  const customerForm = document.getElementById('customerForm');
  const customerSearch = document.getElementById('customerSearch');
  const customerNameInput = document.getElementById('customerNameInput');
  const customerPhoneInput = document.getElementById('customerPhoneInput');

  if (openCustomerModalBtn) {
    openCustomerModalBtn.addEventListener('click', openCustomerModal);
  }

  if (customerForm) {
    customerForm.addEventListener('submit', saveCustomer);
  }

  document.querySelectorAll('[data-close-customer="true"]').forEach((element) => {
    element.addEventListener('click', closeCustomerModal);
  });

  if (customerSearch) {
    customerSearch.addEventListener('input', renderCustomers);
  }

  if (customerNameInput) {
    customerNameInput.addEventListener('input', renderCustomers);
  }

  if (customerPhoneInput) {
    customerPhoneInput.addEventListener('input', renderCustomers);
  }

  await loadCustomers();
});
