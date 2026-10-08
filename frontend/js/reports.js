let reportRangeInvalid = false;
let reportData = [];
let reportSummary = { sales: 0, revenue: 0, profit: 0, inventoryValue: 0, lowStock: 0, outOfStock: 0, totalProducts: 0, inStock: 0 };

function formatCurrency(value) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function getDateFromInput(value) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function showReportMessage(message, isError = true) {
  const messageBox = document.getElementById('reportFilterMessage');
  if (!messageBox) return;

  messageBox.textContent = message;
  messageBox.classList.toggle('error', isError);
  messageBox.style.display = message ? 'block' : 'none';
}

async function loadReports(period = 'month') {
  try {
    const response = await window.ShopTrackApi.request(`/api/reports?period=${encodeURIComponent(period)}&type=summary`);
    reportData = response.data || [];
    reportSummary = response.summary || {
      sales: 0,
      revenue: 0,
      profit: 0,
      inventoryValue: 0,
      lowStock: 0,
      outOfStock: 0,
      totalProducts: 0,
      inStock: 0,
    };
    renderReportView();
  } catch (error) {
    console.error(error);
    showReportMessage(error.message);
  }
}

function getFilteredReportData() {
  const fromInput = document.getElementById('reportFromDate');
  const toInput = document.getElementById('reportToDate');

  reportRangeInvalid = false;
  const fromDate = fromInput ? getDateFromInput(fromInput.value) : null;
  const toDate = toInput ? getDateFromInput(toInput.value) : null;

  if (fromDate && toDate && fromDate > toDate) {
    reportRangeInvalid = true;
    showReportMessage('The From date cannot be later than the To date.', true);
    return [];
  }

  if (!fromDate && !toDate) {
    return [...reportData];
  }

  return reportData.filter((record) => {
    const currentDate = getDateFromInput(record.date);
    const matchesFrom = !fromDate || currentDate >= fromDate;
    const matchesTo = !toDate || currentDate <= toDate;
    return matchesFrom && matchesTo;
  });
}

function renderReportView() {
  const filteredData = getFilteredReportData();
  updateSummaryCards(filteredData);
  updateSalesTrend(filteredData);
  updateProfitChart(filteredData);
  updateStatusList(filteredData);
  updateProductList(filteredData);
}

function updateSummaryCards(filteredData) {
  const cards = document.querySelectorAll('.summary-grid .metric-card .metric-value');
  if (!cards.length) return;

  const totals = filteredData.reduce(
    (accumulator, record) => {
      accumulator.sales += Number(record.sales || 0);
      accumulator.revenue += Number(record.revenue || 0);
      accumulator.profit += Number(record.profit || 0);
      return accumulator;
    },
    { sales: 0, revenue: 0, profit: 0 }
  );

  const fallback = { sales: reportSummary.sales, revenue: reportSummary.revenue, profit: reportSummary.profit };

  cards[0].textContent = formatCurrency(filteredData.length ? totals.sales : fallback.sales);
  cards[1].textContent = formatCurrency(filteredData.length ? totals.revenue : fallback.revenue);
  cards[2].textContent = formatCurrency(filteredData.length ? totals.profit : fallback.profit);
  cards[3].textContent = formatCurrency(reportSummary.inventoryValue);
  cards[4].textContent = String(reportSummary.lowStock);
  cards[5].textContent = String(reportSummary.outOfStock);
}

function updateSalesTrend(filteredData) {
  const bars = document.querySelectorAll('.small-bars span');
  if (!bars.length) return;

  const salesValues = filteredData.length ? filteredData.map((record) => Number(record.sales || 0)) : [0];
  const maxValue = Math.max(...salesValues, 1);

  bars.forEach((bar, index) => {
    const record = filteredData[index] || null;
    const value = record ? Number(record.sales || 0) : 0;
    const height = filteredData.length ? (value / maxValue) * 100 : 0;
    bar.style.height = `${Math.max(height, 8)}%`;
  });
}

function updateProfitChart(filteredData) {
  const bars = document.querySelectorAll('.mini-chart span');
  if (!bars.length) return;

  const values = filteredData.length ? filteredData.map((record) => Number(record.profit || 0)) : [0];
  const maxValue = Math.max(...values, 1);

  bars.forEach((bar, index) => {
    const record = filteredData[index] || null;
    const value = record ? Number(record.profit || 0) : 0;
    const height = filteredData.length ? (value / maxValue) * 100 : 0;
    bar.style.height = `${Math.max(height, 10)}%`;
  });
}

function updateStatusList(filteredData) {
  const statusItems = document.querySelectorAll('.status-item');
  if (!statusItems.length) return;

  const lowStockCount = Number(reportSummary.lowStock || 0);
  const outOfStockCount = Number(reportSummary.outOfStock || 0);
  const totalProducts = Number(reportSummary.totalProducts || lowStockCount + outOfStockCount);
  const inStockCount = Math.max(totalProducts - lowStockCount - outOfStockCount, 0);

  const stockLabel = statusItems[0]?.querySelector('div small');
  const lowStockLabel = statusItems[1]?.querySelector('div small');
  const outOfStockLabel = statusItems[2]?.querySelector('div small');

  if (stockLabel) {
    stockLabel.textContent = `${inStockCount} items`;
  }

  if (lowStockLabel) {
    lowStockLabel.textContent = `${lowStockCount} items`;
  }

  if (outOfStockLabel) {
    outOfStockLabel.textContent = `${outOfStockCount} items`;
  }

  const stockCount = statusItems[0]?.querySelector('.status-count');
  const lowStockCountEl = statusItems[1]?.querySelector('.status-count');
  const outOfStockCountEl = statusItems[2]?.querySelector('.status-count');

  const total = Math.max(totalProducts, 1);

  if (stockCount) stockCount.textContent = `${Math.round((inStockCount / total) * 100)}%`;
  if (lowStockCountEl) lowStockCountEl.textContent = `${Math.round((lowStockCount / total) * 100)}%`;
  if (outOfStockCountEl) outOfStockCountEl.textContent = `${Math.round((outOfStockCount / total) * 100)}%`;
}

function updateProductList(filteredData) {
  const rows = document.querySelectorAll('.simple-list li');
  if (!rows.length) return;

  const totals = filteredData.reduce((accumulator, record) => {
    const products = record.productSales || {};
    Object.entries(products).forEach(([name, value]) => {
      accumulator[name] = (accumulator[name] || 0) + Number(value || 0);
    });
    return accumulator;
  }, {});

  const sortedProducts = Object.entries(totals).sort((left, right) => right[1] - left[1]).slice(0, 4);

  rows.forEach((row, index) => {
    const product = sortedProducts[index];
    if (!product) {
      row.innerHTML = '<span>No products</span><strong>₦0</strong>';
      return;
    }

    row.innerHTML = `<span>${product[0]}</span><strong>${formatCurrency(product[1])}</strong>`;
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const applyButton = document.getElementById('applyReportFilterBtn');
  const resetButton = document.getElementById('resetReportFilterBtn');

  if (applyButton) {
    applyButton.addEventListener('click', renderReports);
  }

  if (resetButton) {
    resetButton.addEventListener('click', resetReportFilter);
  }

  await loadReports('month');
});

function renderReports() {
  const filteredData = getFilteredReportData();
  const hasData = filteredData.length > 0;

  if (reportRangeInvalid) {
    return;
  }

  if (!hasData) {
    const fromInput = document.getElementById('reportFromDate');
    const toInput = document.getElementById('reportToDate');
    const hasRangeSelected = (fromInput && fromInput.value) || (toInput && toInput.value);

    showReportMessage(
      hasRangeSelected
        ? 'No records found for the selected date range.'
        : 'No report data is available for the selected period.',
      true
    );

    updateSummaryCards([]);
    updateSalesTrend([]);
    updateProfitChart([]);
    updateStatusList([]);
    updateProductList([]);
    return;
  }

  showReportMessage('', false);
  updateSummaryCards(filteredData);
  updateSalesTrend(filteredData);
  updateProfitChart(filteredData);
  updateStatusList(filteredData);
  updateProductList(filteredData);
}

function resetReportFilter() {
  const fromInput = document.getElementById('reportFromDate');
  const toInput = document.getElementById('reportToDate');

  reportRangeInvalid = false;
  if (fromInput) fromInput.value = '';
  if (toInput) toInput.value = '';

  showReportMessage('', false);
  renderReports();
}
