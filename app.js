/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// LocalStorage Keys
const STORAGE_KEY = 'coincraft_v2_transactions';
const CURRENCY_KEY = 'expense_tracker_currency';

// Seed Data for the first-time user experience
const INITIAL_SEED_TRANSACTIONS = [
  {
    id: 'seed-1',
    description: 'Monthly Salary Payment',
    amount: 3200.00,
    category: 'Other',
    type: 'income',
    paymentMethod: 'Net Banking',
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'seed-2',
    description: 'Weekly Organic Grocery Shopping',
    amount: 142.50,
    category: 'Food',
    type: 'expense',
    paymentMethod: 'Credit Card',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'seed-3',
    description: 'Fuel & Public Transit Passes',
    amount: 65.00,
    category: 'Transport',
    type: 'expense',
    paymentMethod: 'Debit Card',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'seed-4',
    description: 'High-speed Fiber Internet & Streaming',
    amount: 89.90,
    category: 'Bills',
    type: 'expense',
    paymentMethod: 'UPI',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'seed-5',
    description: 'Coffee & Snacks',
    amount: 15.00,
    category: 'Food',
    type: 'expense',
    paymentMethod: 'Cash',
    date: new Date().toISOString(),
  },
];

// Application state
let state = {
  transactions: [],
  currencySymbol: '$',
  formType: 'expense', // 'expense' | 'income'
  formPaymentMethod: 'Cash', // Default payment method
  filters: {
    searchQuery: '',
    type: 'all',
    category: 'all',
    paymentMethod: 'all',
    dateFrom: '',
    dateTo: '',
    sortBy: 'newest'
  }
};

// Maps categories to corresponding Lucide Icon name
const categoryIconMap = {
  Food: 'utensils',
  Transport: 'car',
  Bills: 'receipt',
  Shopping: 'shopping-bag',
  Other: 'coins'
};

// Maps payment methods to corresponding Lucide Icon name
const paymentMethodIconMap = {
  'Cash': 'banknote',
  'Debit Card': 'credit-card',
  'Credit Card': 'badge-dollar-sign',
  'UPI': 'smartphone',
  'Net Banking': 'landmark'
};

// Helper: Get hex color values for categories (for SVG Donut chart rendering)
function getCategoryColorHex(cat) {
  const colors = {
    Food: '#f97316',     // Orange
    Transport: '#3b82f6',    // Blue
    Bills: '#f59e0b',    // Amber
    Shopping: '#a855f7', // Purple
    Other: '#64748b'     // Slate
  };
  return colors[cat] || colors.Other;
}

// Helper: Get hex color values for payment methods (for SVG Donut chart rendering)
function getPaymentMethodColorHex(method) {
  const colors = {
    'Cash': '#22c55e',       // Green
    'Debit Card': '#3b82f6', // Blue
    'Credit Card': '#f43f5e', // Rose
    'UPI': '#8b5cf6',        // Violet
    'Net Banking': '#f59e0b' // Amber
  };
  return colors[method] || '#64748b';
}

// Helper: Get CSS class name for payment method badges
function getPaymentMethodClass(method) {
  const classes = {
    'Cash': 'pm-cash',
    'Debit Card': 'pm-debit',
    'Credit Card': 'pm-credit',
    'UPI': 'pm-upi',
    'Net Banking': 'pm-netbanking'
  };
  return classes[method] || '';
}

// Helper: Format currency matching formatting requirements
function formatCurrency(amount) {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Math.abs(amount));

  return formatted.replace('$', state.currencySymbol);
}

// Helper: Format date for human readability
function formatDate(dateString) {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}

// Save transactions list to localStorage
function saveTransactions() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.transactions));
  } catch (e) {
    console.error('Failed to write transactions to localStorage', e);
  }
}

// Render Balance Card and Income/Expense Statistics
function renderBalanceSummary() {
  let income = 0;
  let expenses = 0;

  state.transactions.forEach((t) => {
    if (t.type === 'income') {
      income += t.amount;
    } else {
      expenses += t.amount;
    }
  });

  const balance = income - expenses;
  const isNegative = balance < 0;

  // Update DOM values
  const balanceAmountEl = document.getElementById('balance-amount');
  const balanceCardEl = document.getElementById('balance-card');
  const incomeAmountEl = document.getElementById('income-amount');
  const expensesAmountEl = document.getElementById('expenses-amount');
  const incomeProgressEl = document.getElementById('income-progress');
  const expensesProgressEl = document.getElementById('expenses-progress');

  // Value formatting
  balanceAmountEl.textContent = `${isNegative ? '-' : ''}${formatCurrency(balance)}`;
  incomeAmountEl.textContent = formatCurrency(income);
  expensesAmountEl.textContent = formatCurrency(expenses);

  // Balance Card UI Updates
  if (isNegative) {
    balanceAmountEl.className = 'balance-amount negative';
    balanceCardEl.className = 'card balance-card negative';
  } else {
    balanceAmountEl.className = 'balance-amount';
    balanceCardEl.className = 'card balance-card positive';
  }

  // Progress Bar Calculations
  const totalTurnover = income + expenses;
  const incomePercent = totalTurnover > 0 ? (income / totalTurnover) * 100 : 0;
  const expensePercent = totalTurnover > 0 ? (expenses / totalTurnover) * 100 : 0;

  // Use timeout to trigger CSS animations smoothly
  setTimeout(() => {
    incomeProgressEl.style.width = `${incomePercent}%`;
    expensesProgressEl.style.width = `${expensePercent}%`;
  }, 50);
}

// Render SVG category chart and bars breakdown
function renderCategoryChart() {
  const container = document.getElementById('chart-dynamic-content');
  const expensesOnly = state.transactions.filter(t => t.type === 'expense');
  const totalExpense = expensesOnly.reduce((sum, t) => sum + t.amount, 0);

  if (totalExpense === 0) {
    container.innerHTML = `
      <div class="empty-chart-state">
        <div class="empty-icon-box">
          <i data-lucide="pie-chart" style="width: 1.5rem; height: 1.5rem;"></i>
        </div>
        <p class="empty-title">No expenses to display</p>
        <p class="empty-desc">Visual graphs will automatically update once you record any expense item in your log.</p>
      </div>
    `;
    return;
  }

  // Calculate totals per category
  const categoryTotals = { Food: 0, Transport: 0, Bills: 0, Shopping: 0, Other: 0 };
  expensesOnly.forEach(t => {
    if (categoryTotals[t.category] !== undefined) {
      categoryTotals[t.category] += t.amount;
    } else {
      categoryTotals.Other += t.amount;
    }
  });

  const CATEGORIES = ['Food', 'Transport', 'Bills', 'Shopping', 'Other'];
  const categoryData = CATEGORIES.map(cat => {
    const amt = categoryTotals[cat];
    const pct = totalExpense > 0 ? (amt / totalExpense) * 100 : 0;
    return {
      category: cat,
      amount: amt,
      percentage: parseFloat(pct.toFixed(1)),
      colorHex: getCategoryColorHex(cat)
    };
  }).sort((a, b) => b.amount - a.amount);

  // SVG parameters
  const radius = 50;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;
  let circlesHtml = '';

  categoryData.filter(d => d.percentage > 0).forEach(d => {
    const strokeDashOffset = circumference - (d.percentage / 100) * circumference;
    const rotationAngle = (accumulatedPercent / 100) * 360 - 90; // Align starting position to the top
    accumulatedPercent += d.percentage;

    circlesHtml += `
      <circle
        cx="60"
        cy="60"
        r="${radius}"
        class="donut-segment"
        stroke="${d.colorHex}"
        stroke-width="${strokeWidth}"
        stroke-dasharray="${circumference}"
        stroke-dashoffset="${strokeDashOffset}"
        stroke-linecap="round"
        style="transform-origin: 60px 60px; transform: rotate(${rotationAngle}deg);"
      />
    `;
  });

  let listHtml = '';
  categoryData.forEach(d => {
    const hasSpending = d.amount > 0;
    listHtml += `
      <div class="chart-row">
        <div class="chart-row-header">
          <div class="chart-row-category">
            <span class="category-dot" style="background-color: ${d.colorHex};"></span>
            <span>${d.category}</span>
          </div>
          <div class="chart-row-values">
            <span>${formatCurrency(d.amount)}</span>
            ${hasSpending ? `<span class="chart-row-percentage">(${d.percentage}%)</span>` : ''}
          </div>
        </div>
        <div class="chart-bar-container">
          <div class="chart-bar" style="background-color: ${d.colorHex}; width: ${d.percentage}%;"></div>
        </div>
      </div>
    `;
  });

  container.innerHTML = `
    <div class="chart-content">
      <div class="chart-visual">
        <div class="donut-svg-wrapper">
          <svg viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="${radius}" class="donut-bg" stroke-width="${strokeWidth}" />
            ${circlesHtml}
          </svg>
          <div class="chart-overlay-text">
            <i data-lucide="trending-down" style="width: 1.125rem; height: 1.125rem;"></i>
            <span class="chart-overlay-label">Total Spent</span>
            <span class="chart-overlay-value">${formatCurrency(totalExpense)}</span>
          </div>
        </div>
      </div>
      <div class="chart-list">
        ${listHtml}
      </div>
    </div>
  `;
}

// Render SVG payment method chart and bars breakdown
function renderPaymentMethodChart() {
  const container = document.getElementById('payment-chart-dynamic-content');
  const expensesOnly = state.transactions.filter(t => t.type === 'expense');
  const totalExpense = expensesOnly.reduce((sum, t) => sum + t.amount, 0);

  if (totalExpense === 0) {
    container.innerHTML = `
      <div class="empty-chart-state">
        <div class="empty-icon-box">
          <i data-lucide="wallet-cards" style="width: 1.5rem; height: 1.5rem;"></i>
        </div>
        <p class="empty-title">No expenses to display</p>
        <p class="empty-desc">Your payment method breakdown will appear here once you add some expenses.</p>
      </div>
    `;
    return;
  }

  // Calculate totals per payment method
  const methodTotals = { 'Cash': 0, 'Debit Card': 0, 'Credit Card': 0, 'UPI': 0, 'Net Banking': 0 };
  expensesOnly.forEach(t => {
    const pm = t.paymentMethod || 'Cash'; // Fallback for old data
    if (methodTotals[pm] !== undefined) {
      methodTotals[pm] += t.amount;
    } else {
      methodTotals['Cash'] += t.amount;
    }
  });

  const METHODS = ['Cash', 'Debit Card', 'Credit Card', 'UPI', 'Net Banking'];
  const methodData = METHODS.map(method => {
    const amt = methodTotals[method];
    const pct = totalExpense > 0 ? (amt / totalExpense) * 100 : 0;
    return {
      method: method,
      amount: amt,
      percentage: parseFloat(pct.toFixed(1)),
      colorHex: getPaymentMethodColorHex(method)
    };
  }).sort((a, b) => b.amount - a.amount);

  // SVG parameters
  const radius = 50;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;
  let circlesHtml = '';

  methodData.filter(d => d.percentage > 0).forEach(d => {
    const strokeDashOffset = circumference - (d.percentage / 100) * circumference;
    const rotationAngle = (accumulatedPercent / 100) * 360 - 90; // Align starting position to the top
    accumulatedPercent += d.percentage;

    circlesHtml += `
      <circle
        cx="60"
        cy="60"
        r="${radius}"
        class="donut-segment"
        stroke="${d.colorHex}"
        stroke-width="${strokeWidth}"
        stroke-dasharray="${circumference}"
        stroke-dashoffset="${strokeDashOffset}"
        stroke-linecap="round"
        style="transform-origin: 60px 60px; transform: rotate(${rotationAngle}deg);"
      />
    `;
  });

  let listHtml = '';
  methodData.forEach(d => {
    const hasSpending = d.amount > 0;
    listHtml += `
      <div class="chart-row">
        <div class="chart-row-header">
          <div class="chart-row-category">
            <span class="category-dot" style="background-color: ${d.colorHex};"></span>
            <span>${d.method}</span>
          </div>
          <div class="chart-row-values">
            <span>${formatCurrency(d.amount)}</span>
            ${hasSpending ? `<span class="chart-row-percentage">(${d.percentage}%)</span>` : ''}
          </div>
        </div>
        <div class="chart-bar-container">
          <div class="chart-bar" style="background-color: ${d.colorHex}; width: ${d.percentage}%;"></div>
        </div>
      </div>
    `;
  });

  container.innerHTML = `
    <div class="chart-content">
      <div class="chart-visual">
        <div class="donut-svg-wrapper">
          <svg viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="${radius}" class="donut-bg" stroke-width="${strokeWidth}" />
            ${circlesHtml}
          </svg>
          <div class="chart-overlay-text">
            <i data-lucide="wallet" style="width: 1.125rem; height: 1.125rem;"></i>
            <span class="chart-overlay-label">Total Spent</span>
            <span class="chart-overlay-value">${formatCurrency(totalExpense)}</span>
          </div>
        </div>
      </div>
      <div class="chart-list">
        ${listHtml}
      </div>
    </div>
  `;
}


// Render transactional ledger logs history list
function renderTransactionList() {
  const scrollArea = document.getElementById('transactions-scroll-area');
  const countSub = document.getElementById('ledger-count-sub');
  const clearAllBtn = document.getElementById('clear-all-btn');

  if (state.transactions.length === 0) {
    clearAllBtn.classList.add('hidden');
    countSub.textContent = 'Showing 0 of 0 records';
    scrollArea.innerHTML = `
      <div class="empty-list-state">
        <div class="empty-icon-box">
          <i data-lucide="receipt-text" style="width: 1.5rem; height: 1.5rem;"></i>
        </div>
        <p class="empty-title">No transactions yet</p>
        <p class="empty-desc">Your logs are empty. Start keeping track of your finance by inserting your first record.</p>
      </div>
    `;
    return;
  }

  clearAllBtn.classList.remove('hidden');

  // Filter items
  let filtered = [...state.transactions];

  if (state.filters.searchQuery) {
    const query = state.filters.searchQuery.toLowerCase();
    filtered = filtered.filter(t =>
      t.description.toLowerCase().includes(query) ||
      t.category.toLowerCase().includes(query) ||
      (t.paymentMethod && t.paymentMethod.toLowerCase().includes(query))
    );
  }

  if (state.filters.type !== 'all') {
    filtered = filtered.filter(t => t.type === state.filters.type);
  }

  if (state.filters.category !== 'all') {
    filtered = filtered.filter(t => t.category === state.filters.category);
  }

  if (state.filters.paymentMethod !== 'all') {
    filtered = filtered.filter(t => (t.paymentMethod || 'Cash') === state.filters.paymentMethod);
  }

  if (state.filters.dateFrom) {
    const fromDate = new Date(state.filters.dateFrom).getTime();
    filtered = filtered.filter(t => new Date(t.date).getTime() >= fromDate);
  }

  if (state.filters.dateTo) {
    const toDate = new Date(state.filters.dateTo);
    toDate.setHours(23, 59, 59, 999);
    filtered = filtered.filter(t => new Date(t.date).getTime() <= toDate.getTime());
  }

  // Sort items
  filtered.sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    const amtA = a.amount;
    const amtB = b.amount;

    switch (state.filters.sortBy) {
      case 'newest':
        return dateB - dateA;
      case 'oldest':
        return dateA - dateB;
      case 'amount-high':
        return amtB - amtA;
      case 'amount-low':
        return amtA - amtB;
      default:
        return 0;
    }
  });

  countSub.textContent = `Showing ${filtered.length} of ${state.transactions.length} records`;

  if (filtered.length === 0) {
    scrollArea.innerHTML = `
      <div style="padding: 3rem 1.5rem; text-align: center; color: var(--color-text-light); font-size: 0.875rem; border: 2px dashed var(--border-color); border-radius: var(--radius-md); font-weight: 500;">
        No match found for filters or search query.
      </div>
    `;
    return;
  }

  let listHtml = '';
  filtered.forEach(t => {
    const isExpense = t.type === 'expense';
    const iconName = categoryIconMap[t.category] || 'coins';
    const catClass = t.category.toLowerCase();
    const paymentMethod = t.paymentMethod || 'Cash';
    const pmClass = getPaymentMethodClass(paymentMethod);

    listHtml += `
      <div id="transaction-item-${t.id}" class="transaction-item">
        <div class="tx-left">
          <div class="tx-icon-box bg-${catClass}">
            <i data-lucide="${iconName}" style="width: 1.125rem; height: 1.125rem;"></i>
          </div>
          <div class="tx-details">
            <p class="tx-desc" title="${t.description}">${t.description}</p>
            <div class="tx-meta">
              <span class="tx-category-badge">${t.category}</span>
              <span class="tx-payment-badge ${pmClass}">${paymentMethod}</span>
              <span class="tx-date">${formatDate(t.date)}</span>
            </div>
          </div>
        </div>
        <div class="tx-right">
          <span class="tx-amount ${isExpense ? 'expense' : 'income'}">
            ${isExpense ? '-' : '+'}${formatCurrency(t.amount)}
          </span>
          <button class="btn-delete-tx" data-id="${t.id}" title="Delete record">
            <i data-lucide="trash-2" style="width: 1rem; height: 1rem; pointer-events: none;"></i>
          </button>
        </div>
      </div>
    `;
  });

  scrollArea.innerHTML = listHtml;

  // Attach Event Listeners to individual delete buttons
  scrollArea.querySelectorAll('.btn-delete-tx').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.getAttribute('data-id');
      handleDeleteTransaction(id);
    });
  });
}

// Global render trigger
function render() {
  renderBalanceSummary();
  renderCategoryChart();
  renderPaymentMethodChart();
  renderTransactionList();

  // Trigger Lucide parsing script
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// Display error messages inside transaction form
function showFormError(msg) {
  const errDiv = document.getElementById('form-error');
  errDiv.textContent = msg;
  errDiv.style.display = 'block';
}

// Handle deletion of a transaction with slide out effect
function handleDeleteTransaction(id) {
  const itemEl = document.getElementById(`transaction-item-${id}`);
  if (itemEl) {
    itemEl.classList.add('item-exit');
    setTimeout(() => {
      state.transactions = state.transactions.filter(t => t.id !== id);
      saveTransactions();
      render();
    }, 250); // Matches stylesheet exit speed (250ms)
  } else {
    state.transactions = state.transactions.filter(t => t.id !== id);
    saveTransactions();
    render();
  }
}

// Setup input interactions & event triggers
function setupEventListeners() {
  // Form submission handler
  const form = document.getElementById('transaction-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const descInput = document.getElementById('description');
    const amtInput = document.getElementById('amount');
    const catSelect = document.getElementById('category');
    const errBox = document.getElementById('form-error');

    errBox.style.display = 'none';

    const description = descInput.value.trim();
    const amount = parseFloat(amtInput.value);
    const category = catSelect.value;
    const type = state.formType;
    const paymentMethod = state.formPaymentMethod;

    if (!description) {
      showFormError('Please enter a description.');
      return;
    }

    if (isNaN(amount) || amount <= 0) {
      showFormError('Please enter a valid amount greater than 0.');
      return;
    }

    // Add transaction node
    const newTx = {
      id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      description,
      amount,
      category,
      type,
      paymentMethod,
      date: new Date().toISOString()
    };

    state.transactions.unshift(newTx);
    saveTransactions();

    // Reset inputs
    descInput.value = '';
    amtInput.value = '';
    catSelect.value = 'Food';
    // Keep the payment method and form type as they were for convenience

    render();
  });

  // Expense/Income form type selection buttons
  const expenseBtn = document.getElementById('toggle-expense-btn');
  const incomeBtn = document.getElementById('toggle-income-btn');
  const submitBtn = document.getElementById('submit-transaction-btn');
  const submitBtnText = document.getElementById('submit-btn-text');

  expenseBtn.addEventListener('click', () => {
    state.formType = 'expense';
    expenseBtn.classList.add('active');
    incomeBtn.classList.remove('active');
    submitBtn.className = 'btn-submit expense';
    submitBtnText.textContent = 'Save Expense';
  });

  incomeBtn.addEventListener('click', () => {
    state.formType = 'income';
    incomeBtn.classList.add('active');
    expenseBtn.classList.remove('active');
    submitBtn.className = 'btn-submit income';
    submitBtnText.textContent = 'Save Income';
  });

  // Payment Method Pill Buttons
  const pmBtns = document.querySelectorAll('.pm-btn');
  pmBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Remove active class from all
      pmBtns.forEach(b => b.classList.remove('active'));
      // Add active class to clicked
      const clickedBtn = e.currentTarget;
      clickedBtn.classList.add('active');
      // Update state
      state.formPaymentMethod = clickedBtn.getAttribute('data-method');
    });
  });

  // Global currency selector change trigger
  const currencySelect = document.getElementById('currency-selector');
  currencySelect.addEventListener('change', (e) => {
    state.currencySymbol = e.target.value;
    localStorage.setItem(CURRENCY_KEY, state.currencySymbol);

    // Update input currency label prefix
    document.getElementById('amount-currency-symbol').textContent = state.currencySymbol;
    render();
  });

  // Wipe statistics list
  document.getElementById('clear-all-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to delete all transaction records? This action is permanent.')) {
      state.transactions = [];
      saveTransactions();
      render();
    }
  });

  // Filter toolbar triggers
  document.getElementById('search-transactions').addEventListener('input', (e) => {
    state.filters.searchQuery = e.target.value;
    renderTransactionList();
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  });

  document.getElementById('filter-type').addEventListener('change', (e) => {
    state.filters.type = e.target.value;
    renderTransactionList();
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  });

  document.getElementById('filter-category').addEventListener('change', (e) => {
    state.filters.category = e.target.value;
    renderTransactionList();
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  });

  document.getElementById('filter-payment').addEventListener('change', (e) => {
    state.filters.paymentMethod = e.target.value;
    renderTransactionList();
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  });

  document.getElementById('filter-date-from').addEventListener('change', (e) => {
    state.filters.dateFrom = e.target.value;
    renderTransactionList();
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  });

  document.getElementById('filter-date-to').addEventListener('change', (e) => {
    state.filters.dateTo = e.target.value;
    renderTransactionList();
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  });

  document.getElementById('sort-by').addEventListener('change', (e) => {
    state.filters.sortBy = e.target.value;
    renderTransactionList();
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  });
}

// Initialise core script bindings
function init() {
  // Load saved currency symbol format preference
  const savedCurrency = localStorage.getItem(CURRENCY_KEY);
  if (savedCurrency) {
    state.currencySymbol = savedCurrency;
    document.getElementById('currency-selector').value = savedCurrency;
    document.getElementById('amount-currency-symbol').textContent = savedCurrency;
  }

  // Load transaction entries from localStorage
  const savedTransactions = localStorage.getItem(STORAGE_KEY);
  if (savedTransactions !== null) {
    let parsed = JSON.parse(savedTransactions);
    // Migration: add default paymentMethod to old transactions
    parsed = parsed.map(t => {
      if (!t.paymentMethod) {
        t.paymentMethod = 'Cash'; // Default for old data
      }
      return t;
    });
    state.transactions = parsed;
  } else {
    // Inject seed values on clean entry
    state.transactions = [...INITIAL_SEED_TRANSACTIONS];
    saveTransactions();
  }

  // Bind active interactions
  setupEventListeners();

  // Populate footer year automatically
  document.getElementById('current-year').textContent = new Date().getFullYear();

  // Trigger main rendering cycles
  render();
}

// Invoke on loaded page context
window.addEventListener('DOMContentLoaded', init);
