const STORAGE_KEY = 'student-expense-tracker-data';
const MONTHLY_BUDGET = 1200;

const form = document.getElementById('entryForm');
const typeField = document.getElementById('entryType');
const amountField = document.getElementById('amount');
const categoryField = document.getElementById('category');
const dateField = document.getElementById('date');
const descriptionField = document.getElementById('description');
const entriesBody = document.getElementById('entriesBody');
const filterType = document.getElementById('filterType');
const resetButton = document.getElementById('resetData');

const incomeTotalEl = document.getElementById('incomeTotal');
const expenseTotalEl = document.getElementById('expenseTotal');
const balanceTotalEl = document.getElementById('balanceTotal');
const spentThisMonthEl = document.getElementById('spentThisMonth');
const budgetProgressBar = document.getElementById('budgetProgressBar');
const budgetMessage = document.getElementById('budgetMessage');

const defaultData = [
  {
    id: crypto.randomUUID(),
    type: 'expense',
    category: 'Food',
    description: 'Groceries',
    date: new Date().toISOString().slice(0, 10),
    amount: 42.5,
  },
  {
    id: crypto.randomUUID(),
    type: 'expense',
    category: 'Transport',
    description: 'Bus pass',
    date: new Date().toISOString().slice(0, 10),
    amount: 28,
  },
  {
    id: crypto.randomUUID(),
    type: 'income',
    category: 'Other',
    description: 'Part-time work',
    date: new Date().toISOString().slice(0, 10),
    amount: 350,
  },
];

function getEntries() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
    return [...defaultData];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [...defaultData];
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
    return [...defaultData];
  }
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(value);
}

function getCurrentMonthEntries(entries) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  return entries.filter((entry) => {
    const date = new Date(entry.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });
}

function updateSummary(entries) {
  const filtered = getCurrentMonthEntries(entries);

  const income = filtered
    .filter((item) => item.type === 'income')
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const expense = filtered
    .filter((item) => item.type === 'expense')
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const balance = income - expense;

  incomeTotalEl.textContent = formatCurrency(income);
  expenseTotalEl.textContent = formatCurrency(expense);
  balanceTotalEl.textContent = formatCurrency(balance);
  spentThisMonthEl.textContent = formatCurrency(expense);

  const percentage = Math.min((expense / MONTHLY_BUDGET) * 100, 100);
  budgetProgressBar.style.width = `${percentage}%`;

  if (expense > MONTHLY_BUDGET) {
    budgetProgressBar.style.background = 'linear-gradient(90deg, #e85757, #ff8a80)';
    budgetMessage.textContent = `You have exceeded your budget by ${formatCurrency(expense - MONTHLY_BUDGET)}.`;
  } else {
    budgetProgressBar.style.background = 'linear-gradient(90deg, #18a957, #ffb020)';
    budgetMessage.textContent = `You are within budget. ${formatCurrency(MONTHLY_BUDGET - expense)} remaining.`;
  }
}

function renderEntries() {
  const entries = getEntries();
  const selectedFilter = filterType.value;

  const visibleEntries = entries.filter((entry) => {
    if (selectedFilter === 'all') return true;
    return entry.type === selectedFilter;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  if (visibleEntries.length === 0) {
    entriesBody.innerHTML = '<tr><td colspan="6" class="empty-state">No transactions found.</td></tr>';
    return;
  }

  entriesBody.innerHTML = visibleEntries
    .map(
      (entry) => `
        <tr>
          <td><span class="type-badge ${entry.type}">${entry.type}</span></td>
          <td>${entry.category}</td>
          <td>${entry.description}</td>
          <td>${new Date(entry.date).toLocaleDateString('en-GB')}</td>
          <td class="amount ${entry.type}">${entry.type === 'income' ? '+' : '-'}${formatCurrency(entry.amount)}</td>
          <td><button class="delete-btn" type="button" data-id="${entry.id}">Delete</button></td>
        </tr>
      `
    )
    .join('');
}

function resetFormDefaults() {
  typeField.value = 'expense';
  categoryField.value = 'Food';
  dateField.value = new Date().toISOString().slice(0, 10);
  descriptionField.value = '';
  amountField.value = '';
  amountField.focus();
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const entry = {
    id: crypto.randomUUID(),
    type: typeField.value,
    amount: Number(amountField.value),
    category: categoryField.value,
    date: dateField.value,
    description: descriptionField.value.trim(),
  };

  if (!entry.amount || entry.amount <= 0 || !entry.description || !entry.date) {
    alert('Please complete all fields with valid values.');
    return;
  }

  const entries = getEntries();
  entries.push(entry);
  saveEntries(entries);
  updateSummary(entries);
  renderEntries();
  resetFormDefaults();
});

entriesBody.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const deleteButton = target.closest('.delete-btn');
  if (!deleteButton) return;

  const entryId = deleteButton.dataset.id;
  const entries = getEntries().filter((entry) => entry.id !== entryId);
  saveEntries(entries);
  updateSummary(entries);
  renderEntries();
});

filterType.addEventListener('change', renderEntries);
resetButton.addEventListener('click', () => {
  const confirmed = window.confirm('Reset all data? This cannot be undone.');
  if (!confirmed) return;

  localStorage.removeItem(STORAGE_KEY);
  const entries = [...defaultData];
  saveEntries(entries);
  updateSummary(entries);
  renderEntries();
  resetFormDefaults();
});

resetFormDefaults();
updateSummary(getEntries());
renderEntries();
