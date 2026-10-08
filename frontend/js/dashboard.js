let dashboardData = {
  summary: [],
  lowStockItems: [],
  recentSales: [],
};

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function renderStatusBadge(status) {
  const statusClass = {
    Paid: 'green',
    Pending: 'yellow',
    Owing: 'blue',
    'Low Stock': 'yellow',
    'Out of Stock': 'red',
  };
  return '<span class="status-badge ' + (statusClass[status] || 'green') + '">' + status + '</span>';
}

async function loadDashboardData() {
  try {
    const [summaryResponse, alertsResponse] = await Promise.all([
      window.ShopTrackApi.request('/api/dashboard'),
      window.ShopTrackApi.request('/api/alerts'),
    ]);

    dashboardData = {
      summary: summaryResponse.summary || [],
      lowStockItems: summaryResponse.lowStockItems || [],
      recentSales: summaryResponse.recentSales || [],
      inventorySummary: summaryResponse.inventorySummary || {},
      alerts: alertsResponse || [],
    };

    renderSummaryCards();
    renderInventoryStatus();
    renderLowStockTable();
    renderRecentSalesTable();
    renderExpiryAlerts();
  } catch (error) {
    console.error(error);
  }
}

function renderSummaryCards() {
  const cards = document.querySelectorAll('.metric-card');
  const cardsData = dashboardData.summary.length ? dashboardData.summary : [
    { label: 'Total Products', value: 0, note: 'Active products' },
    { label: 'Current Stock', value: 0, note: 'Units available' },
    { label: 'Low Stock', value: 0, note: 'Needs replenishment' },
    { label: 'Out of Stock', value: 0, note: 'Immediate attention' },
    { label: "Today's Sales", value: 0, note: 'Current day' },
    { label: 'Revenue', value: 0, note: 'All time' },
    { label: 'Estimated Profit/Loss', value: 0, note: 'Net profit' },
  ];

  const currencyLabels = new Set(["Today's Sales", 'Revenue', 'Estimated Profit/Loss']);

  cards.forEach((card, index) => {
    if (!cardsData[index]) return;
    const item = cardsData[index];
    const label = card.querySelector('.metric-label');
    const value = card.querySelector('.metric-value');
    const note = card.querySelector('.metric-note');
    if (label) label.textContent = item.label;
    if (value) {
      const v = Number(item.value || 0);
      value.textContent = currencyLabels.has(item.label) ? formatCurrency(v) : v;
    }
    if (note) note.textContent = item.note;
  });
}

function renderInventoryStatus() {
  const inv = dashboardData.inventorySummary || {};
  const statusItems = document.querySelectorAll('.status-list .status-item');
  if (!statusItems.length) return;

  const totalProducts = Number(inv.totalProducts || 0);
  const inStock = Number(inv.inStockProducts || 0);
  const lowStock = Number(inv.lowStockProducts || 0);
  const outOfStock = Number(inv.outOfStockProducts || 0);
  const total = Math.max(totalProducts, 1);

  statusItems.forEach((item, index) => {
    const label = item.querySelector('div small');
    const count = item.querySelector('.status-count');
    if (!label || !count) return;

    if (index === 0) {
      label.textContent = `${inStock} items`;
      count.textContent = `${Math.round((inStock / total) * 100)}%`;
    } else if (index === 1) {
      label.textContent = `${lowStock} items`;
      count.textContent = `${Math.round((lowStock / total) * 100)}%`;
    } else if (index === 2) {
      label.textContent = `${outOfStock} items`;
      count.textContent = `${Math.round((outOfStock / total) * 100)}%`;
    }
  });
}

function renderLowStockTable() {
  const tableBody = document.querySelectorAll('.table-panel tbody')[0];
  if (!tableBody) return;

  const rows = dashboardData.lowStockItems.length ? dashboardData.lowStockItems : dashboardData.alerts || [];
  tableBody.innerHTML = rows
    .map((row) => {
      const status = row.status || 'Low Stock';
      return `
        <tr>
          <td>${row.productName || row.product || 'Product'}</td>
          <td>${row.variant || '—'}</td>
          <td>${row.stockQuantity ?? row.availableQuantity ?? 0}</td>
          <td>${renderStatusBadge(status)}</td>
        </tr>
      `;
    })
    .join('');
}

function renderRecentSalesTable() {
  const tableBody = document.querySelectorAll('.recent-sales-panel tbody')[0];
  if (!tableBody) return;

  tableBody.innerHTML = (dashboardData.recentSales || [])
    .map(
      (sale) => `
        <tr>
          <td>${sale.saleNumber || '—'}</td>
          <td>${sale.customerName || 'Walk-in'}</td>
          <td>${formatCurrency(sale.totalAmount || 0)}</td>
          <td>${sale.paymentMethod || 'Cash'}</td>
          <td>${sale.saleDate ? new Date(sale.saleDate).toLocaleString() : '—'}</td>
          <td>${renderStatusBadge('Paid')}</td>
        </tr>
      `
    )
    .join('');
}

function getExpiryAlertClass(status) {
  const alertClassMap = {
    Expired: 'red',
    'Expiring within 1 month': 'orange',
    'Expiring within 3 months': 'yellow',
    'Expiring within 6 months': 'blue',
    Safe: 'green',
  };
  return alertClassMap[status] || 'green';
}

function renderExpiryAlerts() {
  const list = document.getElementById('expiryAlertsList');
  if (!list) return;

  const alerts = (dashboardData.alerts || []).slice(0, 4).map((alert) => ({
    product: alert.productName || 'Product',
    variant: alert.variant || '—',
    batch: alert.batchNumber || 'N/A',
    status: alert.status || 'Low Stock',
    due: alert.availableQuantity <= 0 ? 'Has no stock left' : 'Check stock levels soon',
  }));

  list.innerHTML = alerts
    .map(
      (alert) => `
        <li class="expiry-alert-item">
          <div class="expiry-alert-copy">
            <strong>${alert.product}</strong>
            <small>${alert.variant} • ${alert.batch}</small>
          </div>
          <span class="status-badge ${getExpiryAlertClass(alert.status)}">${alert.status}</span>
          <small>${alert.due}</small>
        </li>
      `
    )
    .join('');
}

document.addEventListener('DOMContentLoaded', async () => {
  const quickAddProductBtn = document.getElementById('quickAddProductBtn');
  const quickAddStockBtn = document.getElementById('quickAddStockBtn');
  const quickNewSaleBtn = document.getElementById('quickNewSaleBtn');

  if (quickAddProductBtn) {
    quickAddProductBtn.addEventListener('click', () => {
      window.location.href = 'products.html#add-product';
    });
  }

  if (quickAddStockBtn) {
    quickAddStockBtn.addEventListener('click', () => {
      window.location.href = 'inventory.html#add-stock';
    });
  }

  if (quickNewSaleBtn) {
    quickNewSaleBtn.addEventListener('click', () => {
      window.location.href = 'sales.html';
    });
  }

  await loadDashboardData();
});
