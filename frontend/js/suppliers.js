let suppliers = [];
let editingSupplierId = null;

async function loadSuppliers() {
  try {
    suppliers = (await window.ShopTrackApi.request('/api/suppliers')) || [];
    renderSuppliers();
  } catch (error) {
    const tableBody = document.getElementById('suppliersTableBody');
    if (tableBody) {
      tableBody.innerHTML = '<tr><td colspan="7">Unable to load suppliers.</td></tr>';
    }
    console.error(error);
  }
}

function updateSupplierCount(filteredSuppliers) {
  const countLabel = document.getElementById('suppliersCountLabel');
  if (countLabel) {
    countLabel.textContent = `${filteredSuppliers.length} item${filteredSuppliers.length === 1 ? '' : 's'}`;
  }
}

function renderSuppliers() {
  const tableBody = document.getElementById('suppliersTableBody');
  const searchInput = document.getElementById('supplierSearch');
  const nameFilter = document.getElementById('supplierNameFilter');

  if (!tableBody) return;

  const searchText = (searchInput?.value || '').trim().toLowerCase();
  const selectedName = (nameFilter?.value || '').trim().toLowerCase();

  const filteredSuppliers = suppliers.filter((supplier) => {
    const name = String(supplier.name || '').toLowerCase();
    const contactName = String(supplier.contactName || '').toLowerCase();
    const phone = String(supplier.phone || '').toLowerCase();
    const email = String(supplier.email || '').toLowerCase();

    const matchesSearch = !searchText || name.includes(searchText) || contactName.includes(searchText) || phone.includes(searchText) || email.includes(searchText);
    const matchesName = !selectedName || name.includes(selectedName);

    return matchesSearch && matchesName;
  });

  updateSupplierCount(filteredSuppliers);

  tableBody.innerHTML = filteredSuppliers
    .map(
      (supplier) => `
      <tr>
        <td>${supplier.name}</td>
        <td>${supplier.contactName || '—'}</td>
        <td>${supplier.phone || '—'}</td>
        <td>${supplier.email || '—'}</td>
        <td>${supplier.address || '—'}</td>
        <td>—</td>
        <td><button type="button" class="table-action edit-supplier-btn" data-supplier-id="${supplier.id}">Edit</button></td>
      </tr>
    `
    )
    .join('');
}

function openSupplierModal(supplier = null) {
  const modal = document.getElementById('supplierModal');
  const form = document.getElementById('supplierForm');
  const message = document.getElementById('supplierFormMessage');
  const title = document.getElementById('supplierModalTitle');

  if (!modal || !form) return;

  editingSupplierId = supplier ? supplier.id : null;
  title.textContent = supplier ? 'Edit Supplier' : 'Add Supplier';

  form.reset();
  message.textContent = '';
  message.className = 'form-message';

  if (supplier) {
    document.getElementById('supplierName').value = supplier.name;
    document.getElementById('supplierContactPerson').value = supplier.contactName || '';
    document.getElementById('supplierPhone').value = supplier.phone || '';
    document.getElementById('supplierEmail').value = supplier.email || '';
    document.getElementById('supplierAddress').value = supplier.address || '';
    document.getElementById('supplierNotes').value = '';
  }

  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  document.getElementById('supplierName').focus();
}

function closeSupplierModal() {
  const modal = document.getElementById('supplierModal');
  const form = document.getElementById('supplierForm');
  const message = document.getElementById('supplierFormMessage');

  if (!modal || !form) return;

  editingSupplierId = null;
  form.reset();
  message.textContent = '';
  message.className = 'form-message';
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
}

function validateSupplierForm() {
  const requiredFields = ['supplierName', 'supplierContactPerson', 'supplierPhone'];

  for (const fieldId of requiredFields) {
    const field = document.getElementById(fieldId);
    if (!field || !field.value || field.value.trim() === '') {
      return `${field?.previousElementSibling?.textContent || 'A required field'} is required.`;
    }
  }

  return null;
}

async function saveSupplier(event) {
  event.preventDefault();

  const message = document.getElementById('supplierFormMessage');
  const validationError = validateSupplierForm();

  if (validationError) {
    message.textContent = validationError;
    message.className = 'form-message error';
    return;
  }

  const supplierData = {
    name: document.getElementById('supplierName').value.trim(),
    contactName: document.getElementById('supplierContactPerson').value.trim(),
    phone: document.getElementById('supplierPhone').value.trim(),
    email: document.getElementById('supplierEmail').value.trim(),
    address: document.getElementById('supplierAddress').value.trim(),
  };

  try {
    if (editingSupplierId !== null) {
      await window.ShopTrackApi.request(`/api/suppliers/${editingSupplierId}`, {
        method: 'PUT',
        body: JSON.stringify(supplierData),
      });
    } else {
      await window.ShopTrackApi.request('/api/suppliers', {
        method: 'POST',
        body: JSON.stringify(supplierData),
      });
    }

    await loadSuppliers();
    closeSupplierModal();
  } catch (error) {
    message.textContent = error.message;
    message.className = 'form-message error';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const openSupplierModalBtn = document.getElementById('openSupplierModalBtn');
  const supplierForm = document.getElementById('supplierForm');
  const searchInput = document.getElementById('supplierSearch');
  const nameFilter = document.getElementById('supplierNameFilter');

  if (openSupplierModalBtn) {
    openSupplierModalBtn.addEventListener('click', () => openSupplierModal());
  }

  if (supplierForm) {
    supplierForm.addEventListener('submit', saveSupplier);
  }

  document.querySelectorAll('[data-close-supplier="true"]').forEach((element) => {
    element.addEventListener('click', closeSupplierModal);
  });

  if (searchInput) {
    searchInput.addEventListener('input', renderSuppliers);
  }

  if (nameFilter) {
    nameFilter.addEventListener('input', renderSuppliers);
  }

  document.addEventListener('click', (event) => {
    const editButton = event.target.closest('.edit-supplier-btn');
    if (editButton) {
      const supplierId = Number(editButton.dataset.supplierId);
      const supplier = suppliers.find((item) => item.id === supplierId);
      if (supplier) {
        openSupplierModal(supplier);
      }
    }
  });

  await loadSuppliers();
});
