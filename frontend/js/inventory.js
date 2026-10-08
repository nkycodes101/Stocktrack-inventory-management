// Inventory page logic wired to the Flask API.
let suppliers = [];
let products = [];
let inventoryItems = [];
let activeInventoryMode = 'add';

function getInventoryStatus(item) {
  const quantity = Number(item.stockQuantity ?? item.currentQuantity ?? 0) || 0;
  const threshold = Number(item.lowStockLevel ?? item.lowStockThreshold ?? 0) || 0;

  if (quantity <= 0) {
    return { label: 'Out of Stock', className: 'status-badge red' };
  }

  if (quantity <= threshold) {
    return { label: 'Low Stock', className: 'status-badge yellow' };
  }

  return { label: 'In Stock', className: 'status-badge green' };
}

function formatWholeNumber(value) {
  return Number(value || 0).toLocaleString('en-US');
}

async function loadInventoryData() {
  try {
    const [productsResponse, suppliersResponse, inventoryResponse] = await Promise.all([
      window.ShopTrackApi.request('/api/products'),
      window.ShopTrackApi.request('/api/suppliers'),
      window.ShopTrackApi.request('/api/inventory'),
    ]);

    suppliers = suppliersResponse || [];
    products = productsResponse || [];
    inventoryItems = (inventoryResponse || []).map((item) => ({
      ...item,
      productName: item.productName || item.product_name || 'Product',
      stockQuantity: Number(item.stockQuantity ?? item.stock_quantity ?? 0),
      lowStockLevel: Number(item.lowStockLevel ?? item.low_stock_level ?? 0),
      productStatus: item.productStatus || item.product_status || 'In Stock',
    }));

    populateProductOptions();
    populateSupplierOptions();
    renderInventoryTable();
  } catch (error) {
    console.error(error);
    const tableBody = document.getElementById('inventoryTableBody');
    if (tableBody) {
      tableBody.innerHTML = '<tr><td colspan="11">Unable to load inventory.</td></tr>';
    }
  }
}

function renderInventoryHistory() {
  const historyBody = document.getElementById('stockHistoryBody');
  if (!historyBody) return;

  if (!inventoryItems.length) {
    historyBody.innerHTML = '<tr><td colspan="5">No stock movement history available.</td></tr>';
    return;
  }

  historyBody.innerHTML = inventoryItems
    .map((item) => `
      <tr>
        <td>${new Date(item.updatedAt || Date.now()).toISOString().slice(0, 10)}</td>
        <td>${item.productName}</td>
        <td>${item.productStatus === 'Low Stock' ? 'Stock Alert' : 'Stock Check'}</td>
        <td>${formatWholeNumber(item.stockQuantity)}</td>
        <td>${item.productStatus}</td>
      </tr>
    `)
    .join('');
}

function renderInventoryTable() {
  const tableBody = document.getElementById('inventoryTableBody');
  const searchInput = document.getElementById('inventorySearch');
  const statusFilter = document.getElementById('inventoryStatusFilter');

  if (!tableBody) return;

  const searchValue = (searchInput?.value || '').trim().toLowerCase();
  const selectedStatus = statusFilter?.value || 'All';

  const filteredItems = inventoryItems.filter((item) => {
    const productName = String(item.productName || '').toLowerCase();
    const sku = String(item.sku || '').toLowerCase();
    const status = getInventoryStatus(item).label;

    const matchesSearch = !searchValue || productName.includes(searchValue) || sku.includes(searchValue);
    const matchesStatus = selectedStatus === 'All' || status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  tableBody.innerHTML = filteredItems
    .map((item) => {
      const stockStatus = getInventoryStatus(item);
      const supplierName = item.supplierName || item.supplier_name || '—';
      return `
        <tr>
          <td>${item.productName}</td>
          <td>Standard</td>
          <td>${item.sku || '—'}</td>
          <td>${supplierName}</td>
          <td>Batch N/A</td>
          <td>${formatWholeNumber(item.stockQuantity)}</td>
          <td>${item.updatedAt ? new Date(item.updatedAt).toISOString().slice(0, 10) : '—'}</td>
          <td>—</td>
          <td><span class="status-badge green">Safe</span></td>
          <td><span class="${stockStatus.className}">${stockStatus.label}</span></td>
          <td><button type="button" class="table-action inventory-adjust-btn" data-item-id="${item.id}">Adjust</button></td>
        </tr>
      `;
    })
    .join('');
}

function populateProductOptions(selectedId = null) {
  const productSelect = document.getElementById('inventoryProduct');
  if (!productSelect) return;

  const productRows = Array.isArray(products) && products.length
    ? products
    : [];

  productSelect.innerHTML = productRows.length
    ? productRows
        .map((item) => `<option value="${item.id}">${item.name}</option>`)
        .join('')
    : '<option value="">No products available</option>';

  if (selectedId !== null) {
    productSelect.value = String(selectedId);
  } else if (productRows.length > 0) {
    productSelect.value = String(productRows[0].id);
  }

  updateInventoryFields();
}

function populateSupplierOptions(selectedId = null) {
  const supplierSelect = document.getElementById('inventorySupplier');
  if (!supplierSelect) return;

  supplierSelect.innerHTML = suppliers.length
    ? suppliers.map((supplier) => `<option value="${supplier.id}">${supplier.name}</option>`).join('')
    : '<option value="">No suppliers available</option>';

  if (selectedId !== null) {
    supplierSelect.value = String(selectedId);
  } else if (suppliers.length > 0) {
    supplierSelect.value = String(suppliers[0].id);
  }
}

function updateInventoryFields() {
  const productSelect = document.getElementById('inventoryProduct');
  const variantField = document.getElementById('inventoryVariant');
  const skuField = document.getElementById('inventorySku');

  if (!productSelect || !variantField || !skuField) return;

  const selectedValue = productSelect.value;
  const selectedItem = inventoryItems.find((item) => String(item.productId ?? item.id) === selectedValue);

  if (!selectedItem) {
    variantField.value = '';
    skuField.value = '';
    return;
  }

  const product = selectedItem.product || {}; 
  variantField.value = selectedItem.variant || product.variant || '';
  skuField.value = selectedItem.sku || product.sku || '';
}

function openInventoryModal(mode, selectedItemId = null) {
  activeInventoryMode = mode;

  const modal = document.getElementById('inventoryModal');
  const form = document.getElementById('inventoryForm');
  const title = document.getElementById('inventoryModalTitle');
  const quantityLabel = document.getElementById('inventoryQuantityLabel');
  const reasonField = document.getElementById('inventoryReasonField');
  const batchField = document.getElementById('inventoryBatchField');
  const message = document.getElementById('inventoryFormMessage');

  if (!modal || !form) return;

  form.reset();
  message.textContent = '';
  message.className = 'form-message';

  populateProductOptions(selectedItemId);
  populateSupplierOptions();

  if (mode === 'add') {
    title.textContent = 'Add Stock';
    quantityLabel.textContent = 'Quantity to Add';
    reasonField.hidden = true;
    batchField.hidden = true;
    document.getElementById('inventorySaveBtn').textContent = 'Save';
    document.getElementById('inventoryQuantity').min = 1;
  } else {
    title.textContent = 'Adjust Stock';
    quantityLabel.textContent = 'Adjustment Quantity';
    reasonField.hidden = false;
    batchField.hidden = false;
    document.getElementById('inventorySaveBtn').textContent = 'Save Adjustment';
    document.getElementById('inventoryQuantity').min = -1000000000;
  }

  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  document.getElementById('inventoryProduct').focus();
}

function closeInventoryModal() {
  const modal = document.getElementById('inventoryModal');
  const form = document.getElementById('inventoryForm');
  const message = document.getElementById('inventoryFormMessage');

  if (!modal || !form) return;

  form.reset();
  message.textContent = '';
  message.className = 'form-message';
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
}

async function saveInventoryForm(event) {
  event.preventDefault();

  const message = document.getElementById('inventoryFormMessage');
  const productSelect = document.getElementById('inventoryProduct');
  const quantityInput = document.getElementById('inventoryQuantity');
  const reasonSelect = document.getElementById('inventoryReason');
  const productId = Number(productSelect?.value || 0);
  const quantity = Number(quantityInput?.value || 0);

  if (!productId || !Number.isFinite(quantity) || quantity === 0) {
    message.textContent = 'Please select a product and enter a valid quantity.';
    message.className = 'form-message error';
    return;
  }

  const targetInventory = inventoryItems.find((item) => Number(item.productId ?? item.id) === productId);
  if (!targetInventory && activeInventoryMode !== 'add') {
    message.textContent = 'Inventory not found for the selected product.';
    message.className = 'form-message error';
    return;
  }

  try {
    if (activeInventoryMode === 'add') {
      const payload = {
        productId,
        stockQuantity: 0,
        lowStockLevel: Number(targetInventory?.lowStockLevel ?? 0),
        stockIn: quantity,
      };

      if (targetInventory) {
        await window.ShopTrackApi.request(`/api/inventory/${targetInventory.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            stockQuantity: Number(targetInventory.stockQuantity) + quantity,
            lowStockLevel: Number(targetInventory.lowStockLevel),
            stockIn: quantity,
          }),
        });
      } else {
        await window.ShopTrackApi.request('/api/inventory', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
    } else {
      const delta = quantity;
      const currentQuantity = Number(targetInventory.stockQuantity || 0);
      const newQuantity = Math.max(0, currentQuantity + delta);
      const adjustmentReason = reasonSelect?.value || 'Manual adjustment';
      const stockOutValue = delta < 0 ? Math.abs(delta) : 0;
      const stockInValue = delta > 0 ? delta : 0;

      await window.ShopTrackApi.request(`/api/inventory/${targetInventory.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          stockQuantity: newQuantity,
          lowStockLevel: Number(targetInventory.lowStockLevel || 0),
          stockIn: stockInValue,
          stockOut: stockOutValue,
          reason: adjustmentReason,
        }),
      });
    }

    await loadInventoryData();
    renderInventoryHistory();
    closeInventoryModal();
  } catch (error) {
    message.textContent = error.message;
    message.className = 'form-message error';
  }
}

function setupInventoryEvents() {
  const addStockBtn = document.getElementById('addStockBtn');
  const adjustStockBtn = document.getElementById('adjustStockBtn');
  const inventorySearch = document.getElementById('inventorySearch');
  const statusFilter = document.getElementById('inventoryStatusFilter');
  const inventoryForm = document.getElementById('inventoryForm');
  const inventoryProduct = document.getElementById('inventoryProduct');

  if (addStockBtn) {
    addStockBtn.addEventListener('click', () => openInventoryModal('add'));
  }

  if (adjustStockBtn) {
    adjustStockBtn.addEventListener('click', () => openInventoryModal('adjust'));
  }

  if (inventorySearch) {
    inventorySearch.addEventListener('input', renderInventoryTable);
  }

  if (statusFilter) {
    statusFilter.addEventListener('change', renderInventoryTable);
  }

  if (inventoryForm) {
    inventoryForm.addEventListener('submit', saveInventoryForm);
  }

  if (inventoryProduct) {
    inventoryProduct.addEventListener('change', updateInventoryFields);
  }

  document.querySelectorAll('[data-close-inventory="true"]').forEach((element) => {
    element.addEventListener('click', closeInventoryModal);
  });

  document.addEventListener('click', (event) => {
    const adjustButton = event.target.closest('.inventory-adjust-btn');
    if (adjustButton) {
      const inventoryId = Number(adjustButton.dataset.itemId);
      const inventoryItem = inventoryItems.find((item) => Number(item.id) === inventoryId);
      if (inventoryItem) {
        openInventoryModal('adjust', Number(inventoryItem.productId ?? inventoryItem.id));
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  if (window.location.hash === '#add-stock') {
    setTimeout(() => openInventoryModal('add'), 0);
  }

  setupInventoryEvents();
  renderInventoryHistory();
  await loadInventoryData();
});
