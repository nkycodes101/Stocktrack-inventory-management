// Sales page logic wired to the Flask API.
const cart = [];
const heldSales = [];
let salesHistory = [];
let catalog = [];

function formatCurrency(value) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

async function loadCatalog() {
  try {
    const [productsResponse, inventoryResponse] = await Promise.all([
      window.ShopTrackApi.request('/api/products'),
      window.ShopTrackApi.request('/api/inventory'),
    ]);

    const inventoryMap = new Map((inventoryResponse || []).map((item) => [Number(item.productId ?? item.product_id), Number(item.stockQuantity ?? item.stock_quantity ?? 0)]));
    catalog = (productsResponse || []).map((product) => ({
      ...product,
      price: Number(product.retailPrice ?? product.retail_price ?? 0),
      currentQuantity: inventoryMap.get(Number(product.id)) ?? Number(product.openingQuantity ?? product.opening_quantity ?? 0),
      lowStockThreshold: Number(product.lowStockThreshold ?? product.low_stock_threshold ?? 0),
    }));

    renderSearchResults();
    updateLowStockAlert();
  } catch (error) {
    console.error(error);
  }
}

async function loadSalesHistory() {
  try {
    salesHistory = (await window.ShopTrackApi.request('/api/sales')) || [];
    renderSalesHistory();
  } catch (error) {
    console.error(error);
  }
}

function renderSearchResults(searchTerm = '') {
  const resultsContainer = document.getElementById('productSearchResults');
  if (!resultsContainer) return;

  const term = searchTerm.trim().toLowerCase();
  const filteredProducts = catalog.filter((product) => {
    if (!term) return true;
    return product.name.toLowerCase().includes(term) || product.sku.toLowerCase().includes(term);
  });

  if (!filteredProducts.length) {
    resultsContainer.innerHTML = '<div class="product-item"><span>No matching products found.</span></div>';
    return;
  }

  resultsContainer.innerHTML = filteredProducts
    .map(
      (product) => `
        <div class="product-item">
          <div>
            <strong>${product.name}</strong><br />
            <small>${product.variant} · ${product.sku}</small>
          </div>
          <div>
            <strong>${formatCurrency(product.price)}</strong>
            <button type="button" data-product-id="${product.id}">Add</button>
          </div>
        </div>
      `
    )
    .join('');
}

function getCartTotal() {
  return cart.reduce((total, item) => total + item.qty * item.unitPrice, 0);
}

function getBalance() {
  const total = getCartTotal();
  const amountPaid = Number(document.getElementById('amountPaid')?.value || 0);
  return total - amountPaid;
}

function showSalesMessage(message, type = 'error') {
  const box = document.getElementById('salesMessage');
  if (!box) return;

  box.textContent = message;
  box.className = 'form-message ' + (type === 'success' ? 'success' : 'error');
}

function updateLowStockAlert() {
  const alertBox = document.getElementById('lowStockAlert');
  if (!alertBox) return;

  const lowStockItems = catalog.filter((product) => product.currentQuantity <= product.lowStockThreshold);

  if (!lowStockItems.length) {
    alertBox.innerHTML = '<strong>Low-stock warning:</strong><span>All products are above their threshold.</span>';
    return;
  }

  const firstLowItem = lowStockItems[0];
  alertBox.innerHTML = `
    <strong>Low-stock warning:</strong>
    <span>${firstLowItem.name} is below minimum stock.</span>
  `;
}

function renderCart() {
  const cartBody = document.getElementById('cartTableBody');
  const totalAmount = document.getElementById('totalAmount');
  const balanceAmount = document.getElementById('balanceAmount');

  if (!cartBody) return;

  if (!cart.length) {
    cartBody.innerHTML = '<tr><td colspan="5">Cart is empty.</td></tr>';
    if (totalAmount) totalAmount.textContent = formatCurrency(0);
    if (balanceAmount) balanceAmount.textContent = formatCurrency(0);
    return;
  }

  cartBody.innerHTML = cart
    .map((item) => {
      const product = catalog.find((entry) => entry.id === item.productId);
      const maxQty = product ? product.currentQuantity : item.qty;

      return `
        <tr>
          <td>${item.productName}<br /><small>${item.variant}</small></td>
          <td>
            <div class="qty-control">
              <button type="button" data-action="decrease" data-product-id="${item.productId}">-</button>
              <input
                type="number"
                class="qty-input"
                data-product-id="${item.productId}"
                value="${item.qty}"
                min="1"
                max="${maxQty}"
                step="1"
                inputmode="numeric"
                aria-label="Quantity for ${item.productName}"
              />
              <button type="button" data-action="increase" data-product-id="${item.productId}">+</button>
            </div>
          </td>
          <td>${formatCurrency(item.unitPrice)}</td>
          <td>${formatCurrency(item.qty * item.unitPrice)}</td>
          <td><button type="button" class="remove-item" data-remove-id="${item.productId}">Remove</button></td>
        </tr>
      `;
    })
    .join('');

  const total = getCartTotal();
  if (totalAmount) totalAmount.textContent = formatCurrency(total);
  if (balanceAmount) balanceAmount.textContent = formatCurrency(getBalance());
}

function addProductToCart(productId) {
  const product = catalog.find((item) => item.id === Number(productId));
  if (!product) return;

  const existingItem = cart.find((item) => item.productId === product.id);

  if (existingItem) {
    existingItem.qty += 1;
  } else {
    cart.push({
      productId: product.id,
      productName: product.name,
      variant: product.variant,
      qty: 1,
      unitPrice: product.price,
    });
  }

  renderCart();
  updateLowStockAlert();
}

function changeCartQuantity(productId, changeAmount) {
  const item = cart.find((entry) => entry.productId === Number(productId));
  if (!item) return;

  const product = catalog.find((entry) => entry.id === Number(productId));
  if (!product) return;

  const targetQty = item.qty + changeAmount;
  const maxAllowedQty = product.currentQuantity;

  if (targetQty < 1) {
    item.qty = 1;
    showSalesMessage('Quantity cannot be less than 1.', 'error');
    renderCart();
    return;
  }

  if (targetQty > maxAllowedQty) {
    item.qty = maxAllowedQty;
    showSalesMessage(`Only ${maxAllowedQty} units of ${product.name} are available in stock.`, 'error');
    renderCart();
    return;
  }

  item.qty = targetQty;
  renderCart();
}

function setCartQuantity(productId, nextQty) {
  const item = cart.find((entry) => entry.productId === Number(productId));
  if (!item) return;

  const product = catalog.find((entry) => entry.id === Number(productId));
  if (!product) return;

  const requestedQty = Number(nextQty);
  const maxAllowedQty = product.currentQuantity;

  if (!Number.isFinite(requestedQty) || requestedQty < 1) {
    item.qty = 1;
    showSalesMessage('Quantity cannot be less than 1.', 'error');
    renderCart();
    return;
  }

  if (requestedQty > maxAllowedQty) {
    item.qty = maxAllowedQty;
    showSalesMessage(`Only ${maxAllowedQty} units of ${product.name} are available in stock.`, 'error');
    renderCart();
    return;
  }

  item.qty = requestedQty;
  renderCart();
}

function removeCartItem(productId) {
  const index = cart.findIndex((item) => item.productId === Number(productId));
  if (index >= 0) cart.splice(index, 1);
  renderCart();
}

function updatePaymentBalance() {
  const balanceAmount = document.getElementById('balanceAmount');
  if (balanceAmount) balanceAmount.textContent = formatCurrency(getBalance());
}

function renderHeldSales() {
  const select = document.getElementById('heldSalesSelect');
  if (!select) return;

  if (!heldSales.length) {
    select.innerHTML = '<option value="">No held sales</option>';
    return;
  }

  select.innerHTML = heldSales
    .map((sale, index) => `<option value="${sale.id}">Held Sale #${index + 1} - ${sale.customerName || 'Walk-in'}</option>`)
    .join('');
}

function saveHeldSale() {
  if (!cart.length) {
    showSalesMessage('There are no items in the cart to hold.', 'error');
    return;
  }

  heldSales.push({
    id: Date.now(),
    cart: JSON.parse(JSON.stringify(cart)),
    customerName: document.getElementById('customerName')?.value.trim() || 'Walk-in',
    phone: document.getElementById('customerPhone')?.value.trim() || '',
    paymentMethod: document.getElementById('paymentMethod')?.value || 'Cash',
    amountPaid: Number(document.getElementById('amountPaid')?.value || 0),
    total: getCartTotal(),
  });

  renderHeldSales();
  showSalesMessage('Sale held successfully.', 'success');
  cart.splice(0, cart.length);
  renderCart();
}

function restoreHeldSale() {
  const select = document.getElementById('heldSalesSelect');
  if (!select || !select.value) {
    showSalesMessage('There is no held sale to restore.', 'error');
    return;
  }

  const heldSale = heldSales.find((sale) => sale.id === Number(select.value));
  if (!heldSale) return;

  cart.splice(0, cart.length, ...JSON.parse(JSON.stringify(heldSale.cart)));

  const customerNameInput = document.getElementById('customerName');
  const customerPhoneInput = document.getElementById('customerPhone');
  const paymentMethodInput = document.getElementById('paymentMethod');
  const amountPaidInput = document.getElementById('amountPaid');

  if (customerNameInput) customerNameInput.value = heldSale.customerName || '';
  if (customerPhoneInput) customerPhoneInput.value = heldSale.phone || '';
  if (paymentMethodInput) paymentMethodInput.value = heldSale.paymentMethod || 'Cash';
  if (amountPaidInput) amountPaidInput.value = heldSale.amountPaid || 0;

  renderCart();
  updatePaymentBalance();
  showSalesMessage('Held sale restored.', 'success');
}

function renderSalesHistory() {
  const salesHistoryBody = document.getElementById('salesHistoryTableBody');
  if (!salesHistoryBody) return;

  if (!salesHistory.length) {
    salesHistoryBody.innerHTML = '<tr><td colspan="5">No completed sales yet.</td></tr>';
    return;
  }

  salesHistoryBody.innerHTML = salesHistory
    .map((sale) => `
      <tr>
        <td>${sale.saleNumber || sale.receiptNumber || '—'}</td>
        <td>${sale.customerName || 'Walk-in'}</td>
        <td>${formatCurrency(sale.totalAmount || sale.total || 0)}</td>
        <td>${sale.paymentMethod || 'Cash'}</td>
        <td>${sale.saleDate ? new Date(sale.saleDate).toLocaleString() : '—'}</td>
      </tr>
    `)
    .join('');
}

function renderReceipt(receiptData) {
  const receiptContent = document.getElementById('receiptContent');
  if (!receiptContent) return;

  receiptContent.innerHTML = `
    <div class="receipt-box">
      <h4>ShopTrack</h4>
      <p><strong>Receipt:</strong> ${receiptData.receiptNumber}</p>
      <p><strong>Date:</strong> ${receiptData.date}</p>
      <p><strong>Customer:</strong> ${receiptData.customerName || 'Walk-in'}</p>
      <hr />
      ${receiptData.items
        .map(
          (item) => `
            <div class="receipt-item">
              <span>${item.productName} x ${item.qty}</span>
              <span>${formatCurrency(item.qty * item.unitPrice)}</span>
            </div>
          `
        )
        .join('')}
      <hr />
      <p><strong>Total:</strong> ${formatCurrency(receiptData.total)}</p>
      <p><strong>Payment:</strong> ${receiptData.paymentMethod}</p>
      <p><strong>Amount Paid:</strong> ${formatCurrency(receiptData.amountPaid)}</p>
      <p><strong>Balance:</strong> ${formatCurrency(receiptData.balance)}</p>
    </div>
  `;
}

function openReceiptModal(receiptData) {
  const receiptModal = document.getElementById('receiptModal');
  if (!receiptModal) return;
  renderReceipt(receiptData);
  receiptModal.classList.remove('hidden');
  receiptModal.setAttribute('aria-hidden', 'false');
}

function closeReceiptModal() {
  const receiptModal = document.getElementById('receiptModal');
  if (!receiptModal) return;
  receiptModal.classList.add('hidden');
  receiptModal.setAttribute('aria-hidden', 'true');
}

async function createCustomerIfNeeded() {
  const customerName = document.getElementById('customerName')?.value.trim();
  const customerPhone = document.getElementById('customerPhone')?.value.trim();

  if (!customerName && !customerPhone) {
    return null;
  }

  try {
    const customers = await window.ShopTrackApi.request('/api/customers');
    const matchedCustomer = customers.find((customer) => {
      const sameName = customerName && customer.name && customer.name.toLowerCase() === customerName.toLowerCase();
      const samePhone = customerPhone && customer.phone && customer.phone.toLowerCase() === customerPhone.toLowerCase();
      return sameName || samePhone;
    });

    if (matchedCustomer) {
      return matchedCustomer.id;
    }

    const createdCustomer = await window.ShopTrackApi.request('/api/customers', {
      method: 'POST',
      body: JSON.stringify({ name: customerName || 'Walk-in Customer', phone: customerPhone || 'N/A' }),
    });
    return createdCustomer.id;
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function completeSale() {
  if (!cart.length) {
    showSalesMessage('Please add at least one product to the cart first.', 'error');
    return;
  }

  const total = getCartTotal();
  const amountPaidInput = document.getElementById('amountPaid');
  const amountPaid = Number(amountPaidInput?.value || 0);
  const paymentMethod = document.getElementById('paymentMethod')?.value || 'Cash';
  const customerName = document.getElementById('customerName')?.value.trim() || 'Walk-in';
  const customerPhone = document.getElementById('customerPhone')?.value.trim() || '';

  if (amountPaid < 0) {
    showSalesMessage('Amount paid cannot be negative.', 'error');
    return;
  }

  const normalizedPaymentMethod = paymentMethod
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace('credit/owe', 'credit')
    .replace('creditowe', 'credit');
  const validMethods = ['cash', 'transfer', 'pos', 'credit'];
  if (!validMethods.includes(normalizedPaymentMethod)) {
    showSalesMessage('Unsupported payment method.', 'error');
    return;
  }

  if (normalizedPaymentMethod !== 'credit' && amountPaid < total) {
    showSalesMessage('Amount paid must be at least the total to pay.', 'error');
    return;
  }

  try {
    const customerId = await createCustomerIfNeeded();
    const payload = {
      customerId: customerId || undefined,
      customerName,
      customerPhone,
      totalAmount: total,
      paymentMethod: normalizedPaymentMethod,
      amountPaid,
      items: cart.map((item) => ({
        productId: item.productId,
        quantity: item.qty,
        unitPrice: item.unitPrice,
      })),
    };

    const createdSale = await window.ShopTrackApi.request('/api/sales', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const receiptData = {
      receiptNumber: createdSale.saleNumber || `ST-${Date.now()}`,
      date: new Date(createdSale.saleDate || Date.now()).toLocaleString(),
      customerName: createdSale.customerName || customerName,
      items: createdSale.items.map((item) => ({
        productName: item.productName,
        qty: item.quantity,
        unitPrice: Number(item.unitPrice || 0),
      })),
      total: Number(createdSale.totalAmount || total),
      paymentMethod: createdSale.paymentMethod || paymentMethod,
      amountPaid: Number(createdSale.amountPaid || amountPaid),
      balance: Number(createdSale.totalAmount || total) - Number(createdSale.amountPaid || amountPaid),
    };

    salesHistory.unshift(createdSale);
    cart.splice(0, cart.length);
    renderCart();
    renderSalesHistory();
    await loadCatalog();
    updateLowStockAlert();
    showSalesMessage('Sale completed successfully.', 'success');
    openReceiptModal(receiptData);

    if (document.getElementById('customerName')) document.getElementById('customerName').value = '';
    if (document.getElementById('customerPhone')) document.getElementById('customerPhone').value = '';
    if (document.getElementById('amountPaid')) document.getElementById('amountPaid').value = '0';
    if (document.getElementById('heldSalesSelect')) document.getElementById('heldSalesSelect').value = '';
    updatePaymentBalance();
  } catch (error) {
    showSalesMessage(error.message, 'error');
  }
}

function bindSalesEvents() {
  const searchInput = document.getElementById('salesProductSearch');
  const addCustomerBtn = document.getElementById('addCustomerBtn');
  const holdSaleBtn = document.getElementById('holdSaleBtn');
  const completeSaleBtn = document.getElementById('completeSaleBtn');
  const receiptBtn = document.getElementById('receiptBtn');
  const restoreHeldSaleBtn = document.getElementById('restoreHeldSaleBtn');
  const amountPaidInput = document.getElementById('amountPaid');
  const paymentMethodInput = document.getElementById('paymentMethod');
  const receiptModalCloseButtons = document.querySelectorAll('[data-close-receipt="true"]');

  if (searchInput) {
    searchInput.addEventListener('input', (event) => renderSearchResults(event.target.value));
  }

  document.addEventListener('click', (event) => {
    const increaseButton = event.target.closest('[data-action="increase"]');
    if (increaseButton) {
      changeCartQuantity(increaseButton.dataset.productId, 1);
      return;
    }

    const decreaseButton = event.target.closest('[data-action="decrease"]');
    if (decreaseButton) {
      changeCartQuantity(decreaseButton.dataset.productId, -1);
      return;
    }

    const removeButton = event.target.closest('[data-remove-id]');
    if (removeButton) {
      removeCartItem(removeButton.dataset.removeId);
      return;
    }

    const productButton = event.target.closest('[data-product-id]');
    if (productButton && !productButton.classList.contains('qty-input')) {
      addProductToCart(productButton.dataset.productId);
    }
  });

  document.addEventListener('input', (event) => {
    const quantityInput = event.target.closest('.qty-input');
    if (!quantityInput) return;

    setCartQuantity(quantityInput.dataset.productId, quantityInput.value);
  });

  if (addCustomerBtn) {
    addCustomerBtn.addEventListener('click', async () => {
      const customerName = document.getElementById('customerName')?.value.trim();
      const customerPhone = document.getElementById('customerPhone')?.value.trim();

      if (!customerName && !customerPhone) {
        showSalesMessage('Enter a customer name or phone number.', 'error');
        return;
      }

      try {
        await createCustomerIfNeeded();
        showSalesMessage('Customer saved for this sale.', 'success');
      } catch (error) {
        showSalesMessage(error.message, 'error');
      }
    });
  }

  if (amountPaidInput) {
    amountPaidInput.addEventListener('input', updatePaymentBalance);
  }

  if (paymentMethodInput) {
    paymentMethodInput.addEventListener('change', updatePaymentBalance);
  }

  if (holdSaleBtn) {
    holdSaleBtn.addEventListener('click', saveHeldSale);
  }

  if (restoreHeldSaleBtn) {
    restoreHeldSaleBtn.addEventListener('click', restoreHeldSale);
  }

  if (completeSaleBtn) {
    completeSaleBtn.addEventListener('click', () => completeSale());
  }

  if (receiptBtn) {
    receiptBtn.addEventListener('click', () => {
      if (!salesHistory.length) {
        showSalesMessage('No receipt is available yet. Complete a sale first.', 'error');
        return;
      }

      const latestReceipt = salesHistory[0];
      const receiptData = {
        receiptNumber: latestReceipt.saleNumber || latestReceipt.receiptNumber,
        date: latestReceipt.saleDate ? new Date(latestReceipt.saleDate).toLocaleString() : '—',
        customerName: latestReceipt.customerName || 'Walk-in',
        items: (latestReceipt.items || []).map((item) => ({
          productName: item.productName || 'Product',
          qty: Number(item.quantity || 0),
          unitPrice: Number(item.unitPrice || 0),
        })),
        total: Number(latestReceipt.totalAmount || latestReceipt.total || 0),
        paymentMethod: latestReceipt.paymentMethod || 'Cash',
        amountPaid: Number(latestReceipt.amountPaid || latestReceipt.total || 0),
        balance: Number(latestReceipt.totalAmount || latestReceipt.total || 0) - Number(latestReceipt.amountPaid || latestReceipt.total || 0),
      };

      openReceiptModal(receiptData);
    });
  }

  const newSaleBtn = document.getElementById('newSaleBtn');
  if (newSaleBtn) {
    newSaleBtn.addEventListener('click', () => {
      cart.splice(0, cart.length);
      renderCart();
      const customerName = document.getElementById('customerName');
      const customerPhone = document.getElementById('customerPhone');
      const amountPaid = document.getElementById('amountPaid');
      const paymentMethod = document.getElementById('paymentMethod');

      if (customerName) customerName.value = '';
      if (customerPhone) customerPhone.value = '';
      if (amountPaid) amountPaid.value = '0';
      if (paymentMethod) paymentMethod.value = 'Cash';

      updatePaymentBalance();
      showSalesMessage('New sale started.', 'success');
    });
  }

  receiptModalCloseButtons.forEach((button) => {
    button.addEventListener('click', closeReceiptModal);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  bindSalesEvents();
  renderCart();
  renderHeldSales();
  renderSalesHistory();
  updateLowStockAlert();
  await loadCatalog();
  await loadSalesHistory();
});
