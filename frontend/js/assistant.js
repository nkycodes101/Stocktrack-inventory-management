const assistantReplies = {
  stock: 'Current stock is healthy overall, but Rice and Toothpaste are near their warning thresholds.',
  sales: 'Today’s sales are trending upward. Focus on replenishing fast-moving items before the close of the day.',
  supplier: 'Supplier activity is stable. Consider reviewing delivery timing for Cactus Supplies and HomeCare Products.',
  expiry: 'The next expiry watch items are Toothpaste and Orange Juice. Review both before the end of the week.'
};

function formatCurrency(value) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function addAssistantMessage(role, text) {
  const messages = document.getElementById('assistantMessages');
  if (!messages) return;

  const message = document.createElement('div');
  message.className = `assistant-message ${role === 'user' ? 'assistant-user' : 'assistant-bot'}`;
  message.innerHTML = role === 'user'
    ? `<strong>You</strong><p>${text}</p>`
    : `<strong>ShopTrack AI</strong><p>${text}</p>`;

  messages.appendChild(message);
  messages.scrollTop = messages.scrollHeight;
}

async function handleSalesSummary() {
  addAssistantMessage('user', 'Sales Summary');
  try {
    const dashboard = await window.ShopTrackApi.request('/api/dashboard');
    const inv = dashboard.inventorySummary || {};
    const sales = await window.ShopTrackApi.request('/api/sales') || [];
    const completedSales = sales.filter(s => (s.status || '').toLowerCase() === 'completed').length;

    const summary = [
      `Total Sales: ${formatCurrency(inv.totalSales)}`,
      `Today's Sales: ${formatCurrency(inv.todaysSales)}`,
      `Completed Sales: ${completedSales}`,
      `Estimated Profit: ${formatCurrency(inv.estimatedProfit)}`,
    ].join('<br>');

    addAssistantMessage('bot', summary);
  } catch (error) {
    addAssistantMessage('bot', `Unable to load sales summary: ${error.message}`);
  }
}

async function handleLowStock() {
  addAssistantMessage('user', 'Low Stock');
  try {
    const inventory = await window.ShopTrackApi.request('/api/inventory') || [];
    const lowStockItems = inventory.filter(item =>
      Number(item.stockQuantity || 0) <= Number(item.lowStockLevel || 0)
    );

    if (lowStockItems.length === 0) {
      addAssistantMessage('bot', 'No low-stock products.');
    } else {
      const html = [
        `<strong>${lowStockItems.length} product(s) at or below low-stock threshold:</strong><br><br>`,
        ...lowStockItems.map(item =>
          `${item.productName} (${item.sku || 'No SKU'}) — ${Number(item.stockQuantity || 0)} in stock (threshold: ${Number(item.lowStockLevel || 0)})`
        ),
      ].join('<br>');

      addAssistantMessage('bot', html);
    }
  } catch (error) {
    addAssistantMessage('bot', `Unable to load low-stock items: ${error.message}`);
  }
}

function getAssistantReply(promptText) {
  const normalized = promptText.toLowerCase();

  if (normalized.includes('stock') || normalized.includes('low')) return assistantReplies.stock;
  if (normalized.includes('sale') || normalized.includes('revenue')) return assistantReplies.sales;
  if (normalized.includes('supplier') || normalized.includes('delivery')) return assistantReplies.supplier;
  if (normalized.includes('expiry') || normalized.includes('expired')) return assistantReplies.expiry;

  return 'I can help with stock, sales, suppliers, and expiry alerts. Try asking about low-stock items or today’s sales.';
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('assistantForm');
  const input = document.getElementById('assistantInput');
  const salesSummaryBtn = document.getElementById('salesSummaryBtn');
  const lowStockBtn = document.getElementById('lowStockBtn');

  if (salesSummaryBtn) {
    salesSummaryBtn.addEventListener('click', handleSalesSummary);
  }

  if (lowStockBtn) {
    lowStockBtn.addEventListener('click', handleLowStock);
  }

  document.querySelectorAll('[data-prompt]').forEach((button) => {
    button.addEventListener('click', () => {
      if (!input) return;
      input.value = button.dataset.prompt || '';
      form?.requestSubmit();
    });
  });

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!input) return;

    const value = input.value.trim();
    if (!value) return;

    addAssistantMessage('user', value);
    addAssistantMessage('bot', getAssistantReply(value));
    input.value = '';
  });
});
