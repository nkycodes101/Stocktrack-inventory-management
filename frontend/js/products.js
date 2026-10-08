// Product management logic for the ShopTrack frontend.
let products = [];
let editingProductId = null;

function getStockStatus(product) {
  const quantity = Number(product.openingQuantity ?? product.opening_quantity ?? 0) || 0;
  const threshold = Number(product.lowStockThreshold ?? product.low_stock_threshold ?? 0) || 0;

  if (quantity <= 0) {
    return { label: 'Out of Stock', className: 'status-badge red' };
  }

  if (quantity <= threshold) {
    return { label: 'Low Stock', className: 'status-badge yellow' };
  }

  return { label: 'In Stock', className: 'status-badge green' };
}

function formatCurrency(value) {
  return Number(value).toLocaleString('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatWholeNumber(value) {
  return Number(value || 0).toLocaleString('en-US');
}

function updateProductCount(filteredProducts) {
  const countLabel = document.getElementById('productsCountLabel');
  if (countLabel) {
    countLabel.textContent = `${filteredProducts.length} item${filteredProducts.length === 1 ? '' : 's'}`;
  }
}

async function loadProducts() {
  try {
    products = (await window.ShopTrackApi.request('/api/products')) || [];
    renderProducts();
  } catch (error) {
    const tableBody = document.getElementById('productsTableBody');
    if (tableBody) {
      tableBody.innerHTML = '<tr><td colspan="11">Unable to load products.</td></tr>';
    }
    console.error(error);
  }
}

function renderProducts() {
  const tableBody = document.getElementById('productsTableBody');
  const searchInput = document.getElementById('productSearch');
  const categoryFilter = document.getElementById('categoryFilter');
  const statusFilter = document.getElementById('statusFilter');

  if (!tableBody) return;

  const searchText = (searchInput?.value || '').trim().toLowerCase();
  const selectedCategory = categoryFilter?.value || 'All';
  const selectedStatus = statusFilter?.value || 'All';

  const filteredProducts = products.filter((product) => {
    const productName = String(product.name || '').toLowerCase();
    const category = String(product.category || '').toLowerCase();
    const variant = String(product.variant || '').toLowerCase();
    const sku = String(product.sku || '').toLowerCase();
    const matchesSearch =
      !searchText || productName.includes(searchText) || category.includes(searchText) || variant.includes(searchText) || sku.includes(searchText);

    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const productStatus = getStockStatus(product).label;
    const matchesStatus = selectedStatus === 'All' || productStatus === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  updateProductCount(filteredProducts);

  tableBody.innerHTML = filteredProducts
    .map((product) => {
      const status = getStockStatus(product);
      return `
        <tr>
          <td>${product.name}</td>
          <td>${product.category}</td>
          <td>${product.variant}</td>
          <td>${product.sku}</td>
          <td>${formatCurrency(product.costPrice)}</td>
          <td>${formatCurrency(product.wholesalePrice)}</td>
          <td>${formatCurrency(product.retailPrice)}</td>
          <td>${formatWholeNumber(product.openingQuantity)}</td>
          <td>${formatWholeNumber(product.lowStockThreshold)}</td>
          <td><span class="${status.className}">${status.label}</span></td>
          <td><button type="button" class="table-action edit-product-btn" data-product-id="${product.id}">Edit</button></td>
        </tr>
      `;
    })
    .join('');
}

function openProductModal(product = null) {
  const modal = document.getElementById('productModal');
  const form = document.getElementById('productForm');
  const message = document.getElementById('productFormMessage');
  const title = document.getElementById('productModalTitle');

  if (!modal || !form) return;

  editingProductId = product ? product.id : null;
  title.textContent = product ? 'Edit Product' : 'Add Product';

  form.reset();
  message.textContent = '';
  message.className = 'form-message';

  if (product) {
    document.getElementById('productName').value = product.name;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productVariant').value = product.variant;
    document.getElementById('productSku').value = product.sku;
    document.getElementById('costPrice').value = product.costPrice;
    document.getElementById('wholesalePrice').value = product.wholesalePrice;
    document.getElementById('retailPrice').value = product.retailPrice;
    document.getElementById('openingQuantity').value = product.openingQuantity;
    document.getElementById('lowStockThreshold').value = product.lowStockThreshold;
  }

  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  document.getElementById('productName').focus();
}

function closeProductModal() {
  const modal = document.getElementById('productModal');
  const form = document.getElementById('productForm');
  const message = document.getElementById('productFormMessage');

  if (!modal || !form) return;

  editingProductId = null;
  form.reset();
  message.textContent = '';
  message.className = 'form-message';
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
}

function validateProductForm() {
  const requiredFields = [
    'productName',
    'productCategory',
    'productVariant',
    'productSku',
    'costPrice',
    'wholesalePrice',
    'retailPrice',
    'openingQuantity',
    'lowStockThreshold',
  ];

  for (const fieldName of requiredFields) {
    const field = document.getElementById(fieldName);
    if (!field || !field.value || field.value.trim() === '') {
      return `${field?.previousElementSibling?.textContent || 'A required field'} is required.`;
    }
  }

  const numericFields = ['costPrice', 'wholesalePrice', 'retailPrice', 'openingQuantity', 'lowStockThreshold'];
  for (const fieldName of numericFields) {
    const value = Number(document.getElementById(fieldName).value);
    if (Number.isNaN(value) || value < 0) {
      return `${document.getElementById(fieldName).previousElementSibling.textContent} must be a valid number.`;
    }
  }

  return null;
}

async function saveProduct(event) {
  event.preventDefault();

  const message = document.getElementById('productFormMessage');
  const validationError = validateProductForm();
  if (validationError) {
    message.textContent = validationError;
    message.className = 'form-message error';
    return;
  }

  const productData = {
    name: document.getElementById('productName').value.trim(),
    category: document.getElementById('productCategory').value.trim(),
    variant: document.getElementById('productVariant').value.trim(),
    sku: document.getElementById('productSku').value.trim(),
    costPrice: Number(document.getElementById('costPrice').value),
    wholesalePrice: Number(document.getElementById('wholesalePrice').value),
    retailPrice: Number(document.getElementById('retailPrice').value),
    openingQuantity: Number(document.getElementById('openingQuantity').value),
    lowStockThreshold: Number(document.getElementById('lowStockThreshold').value),
  };

  try {
    if (editingProductId !== null) {
      await window.ShopTrackApi.request(`/api/products/${editingProductId}`, {
        method: 'PUT',
        body: JSON.stringify(productData),
      });
    } else {
      await window.ShopTrackApi.request('/api/products', {
        method: 'POST',
        body: JSON.stringify(productData),
      });
    }

    await loadProducts();
    closeProductModal();
  } catch (error) {
    message.textContent = error.message;
    message.className = 'form-message error';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const openProductModalBtn = document.getElementById('openProductModalBtn');
  const productForm = document.getElementById('productForm');
  const searchInput = document.getElementById('productSearch');
  const categoryFilter = document.getElementById('categoryFilter');
  const statusFilter = document.getElementById('statusFilter');

  if (window.location.hash === '#add-product') {
    setTimeout(() => openProductModal(), 0);
  }

  if (openProductModalBtn) {
    openProductModalBtn.addEventListener('click', () => openProductModal());
  }

  if (productForm) {
    productForm.addEventListener('submit', saveProduct);
  }

  document.querySelectorAll('[data-close="true"]').forEach((element) => {
    element.addEventListener('click', closeProductModal);
  });

  if (searchInput) {
    searchInput.addEventListener('input', renderProducts);
  }

  if (categoryFilter) {
    categoryFilter.addEventListener('change', renderProducts);
  }

  if (statusFilter) {
    statusFilter.addEventListener('change', renderProducts);
  }

  document.addEventListener('click', (event) => {
    const editButton = event.target.closest('.edit-product-btn');
    if (editButton) {
      const productId = Number(editButton.dataset.productId);
      const product = products.find((item) => item.id === productId);
      if (product) {
        openProductModal(product);
      }
    }
  });

  await loadProducts();
});
