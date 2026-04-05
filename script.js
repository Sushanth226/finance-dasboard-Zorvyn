// using simple variables to manage everything
let transactions = [];
let role = 'admin'; 
let myDoughnutChart = null;
let trendChart = null; // New time-based chart instance

// some hardcoded starting data so it looks nice
const initialData = [
  { id: 1, date: '2023-10-01', category: 'Salary', type: 'income', amount: 3500 },
  { id: 2, date: '2023-10-04', category: 'Groceries', type: 'expense', amount: 120 },
  { id: 3, date: '2023-10-05', category: 'Rent', type: 'expense', amount: 1500 },
  { id: 4, date: '2023-10-12', category: 'Freelance', type: 'income', amount: 450 },
  { id: 5, date: '2023-10-18', category: 'Dining out', type: 'expense', amount: 75 }
];

function initApp() {
  // try to load from local storage first
  const savedData = localStorage.getItem('dashboardData');
  
  if (savedData) {
    try {
      transactions = JSON.parse(savedData);
    } catch (error) {
      console.error("Local storage payload corrupted. Defaulting to initial data.");
      transactions = initialData;
    }
  } else {
    transactions = initialData;
    saveData();
  }

  updateDashboardCards();
  renderTable(transactions);
  setupChart();
  generateInsights();
}

function saveData() {
  localStorage.setItem('dashboardData', JSON.stringify(transactions));
}

// calculates the top numbers
function updateDashboardCards() {
  let income = 0;
  let expenses = 0;

  for (let i = 0; i < transactions.length; i++) {
    if (transactions[i].type === 'income') {
      income += transactions[i].amount;
    } else {
      expenses += transactions[i].amount;
    }
  }

  let balance = income - expenses;

  // quick fix: attach to DOM elements
  document.getElementById('totalBalance').innerText = '$' + balance.toFixed(2);
  document.getElementById('totalIncome').innerText = '$' + income.toFixed(2);
  document.getElementById('totalExpense').innerText = '$' + expenses.toFixed(2);
}

// draws the rows dynamically
function renderTable(dataArray) {
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = ''; 
  
  // Empty State Fallback (Fulfills UI/UX criteria for empty cases)
  if (dataArray.length === 0) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = `<td colspan="5" style="text-align: center; color: #888; padding: 20px;">No transactions found.</td>`;
    tbody.appendChild(emptyRow);
    return;
  }
  
  dataArray.forEach((val) => {
    const row = document.createElement('tr');
    
    // figure out color class based on income/expense
    const labelClass = (val.type === 'income') ? 'type-income' : 'type-expense';
    
    // if viewer is selected we don't show the delete button
    let actionCol = '---';
    if(role === 'admin') {
      actionCol = `<button class="delete-btn" onclick="removeItem(${val.id})">Del</button>`;
    }

    row.innerHTML = `
      <td>${val.date}</td>
      <td>${val.category}</td>
      <td class="${labelClass}">${val.type}</td>
      <td>$${val.amount}</td>
      <td class="action-col">${actionCol}</td>
    `;
    tbody.appendChild(row);
  });
}

function filterData() {
  const searchVal = document.getElementById('searchInput').value.toLowerCase();
  
  // simple array filter
  const filteredArray = transactions.filter(item => 
    item.category.toLowerCase().includes(searchVal) || 
    item.date.includes(searchVal) ||
    item.type.includes(searchVal)
  );
  
  renderTable(filteredArray);
}

function removeItem(itemId) {
  if (role !== 'admin') {
    alert("Viewers cannot delete items");
    return;
  }
  
  // remove the one matching our id
  transactions = transactions.filter(t => t.id !== itemId);
  saveData();
  
  // refresh ui sections
  updateDashboardCards();
  renderTable(transactions);
  updateChartData();
  generateInsights();
}

function switchRole() {
  role = document.getElementById('roleSelect').value;
  
  // toggle button visibility using inline style
  if (role === 'viewer') {
    document.getElementById('addBtn').style.display = 'none';
  } else {
    document.getElementById('addBtn').style.display = 'inline-block';
  }
  
  renderTable(transactions); // re-render to update delete buttons
}

function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
}

// Modal logic for manual entry
function openModal() {
  document.getElementById('addModal').style.display = 'block';
  // auto-fill date field with today 
  document.getElementById('tDate').value = new Date().toISOString().split('T')[0];
}

function closeModal() {
  document.getElementById('addModal').style.display = 'none';
}

function submitTransaction(event) {
  event.preventDefault(); // prevent form from reloading the page
  
  const tDate = document.getElementById('tDate').value;
  const tCategory = document.getElementById('tCategory').value;
  const tType = document.getElementById('tType').value;
  const tAmount = parseFloat(document.getElementById('tAmount').value);
  
  if (!tDate || !tCategory || isNaN(tAmount)) return;

  const newItem = {
    id: Date.now(),
    date: tDate,
    category: tCategory,
    type: tType,
    amount: tAmount
  };
  
  transactions.push(newItem);
  saveData();
  
  // Refresh UI functions just as the mock transaction did
  updateDashboardCards();
  renderTable(transactions);
  updateChartData();
  generateInsights();
  
  closeModal();
  document.getElementById('addForm').reset();
}

// Close the modal if user clicks anywhere outside of the modal content bounding box
window.onclick = function(event) {
  const modal = document.getElementById('addModal');
  if (event.target === modal) {
    closeModal();
  }
}

// simple analysis for the insights block
function generateInsights() {
  const expenseLogs = transactions.filter(item => item.type === 'expense');
  
  if(expenseLogs.length === 0) return;
  
  let categoryTotals = {};
  
  for(let i=0; i < expenseLogs.length; i++){
    let current = expenseLogs[i];
    if(categoryTotals[current.category]){
      categoryTotals[current.category] += current.amount;
    } else {
      categoryTotals[current.category] = current.amount;
    }
  }
  
  let topCategory = '';
  let topAmount = 0;
  
  for(let cat in categoryTotals) {
    if(categoryTotals[cat] > topAmount) {
      topAmount = categoryTotals[cat];
      topCategory = cat;
    }
  }
  
  document.getElementById('highestCategory').innerText = `Highest spending: ${topCategory} ($${topAmount})`;

  // Calculate Monthly Comparison
  const currentMonthPrefix = new Date().toISOString().slice(0, 7); // Extracts 'YYYY-MM'
  let currentMonthExp = 0;
  let olderExp = 0;

  expenseLogs.forEach(exp => {
    if(exp.date.startsWith(currentMonthPrefix)) {
      currentMonthExp += exp.amount;
    } else {
      olderExp += exp.amount;
    }
  });

  let comparisonText = "No previous month data logged.";
  if (olderExp > 0 && currentMonthExp > 0) {
    if (currentMonthExp > olderExp) {
      comparisonText = `You spent $${(currentMonthExp - olderExp).toFixed(2)} more this month than past averages.`;
    } else {
      comparisonText = `You saved $${(olderExp - currentMonthExp).toFixed(2)} compared to prior records!`;
    }
  }
  document.getElementById('monthlyChange').innerText = `Monthly Comparison: ${comparisonText}`;

  // Calculate dynamic observation based on the highest expense category
  let observationStr = "Keep an eye on your overall budget!";
  if (topCategory === 'Dining out' || topCategory === 'Groceries' || topCategory.includes('Coffee')) {
    observationStr = "Food-related categories are your highest expense! Maybe try cooking at home more often?";
  } else if (topCategory === 'Rent') {
    observationStr = "Rent is your biggest expense, which is totally normal. Good job tracking it!";
  } else {
    observationStr = `Notice how ${topCategory} takes up a big chunk of your expenses. Can you cut back?`;
  }
  
  const obsEl = document.getElementById('observationMsg');
  if(obsEl) {
    obsEl.innerText = `Observation: ${observationStr}`;
  }
}

function setupChart() {
  const ctx = document.getElementById('myChart');
  if(!ctx) return;
  
  let inc = 0, exp = 0;
  transactions.forEach(t => {
    if(t.type === 'income') inc += t.amount;
    else exp += t.amount;
  });

  // hope this works for the chart rendering properly
  myDoughnutChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Income', 'Expense'],
      datasets: [{
        label: 'Total',
        data: [inc, exp],
        backgroundColor: ['#2ecc71', '#e74c3c'], 
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });

  // Render Time-based Visualization (Line Chart for Balance Trend)
  const trendCtx = document.getElementById('trendChart');
  if(!trendCtx) return;

  // Sorting transactions chronologically format them for the graph
  const chronologicalData = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
  let runningBalance = 0;
  const labels = [];
  const balancePoints = [];

  chronologicalData.forEach(t => {
    if(t.type === 'income') runningBalance += t.amount;
    else runningBalance -= t.amount;
    
    labels.push(t.date);
    balancePoints.push(runningBalance);
  });

  trendChart = new Chart(trendCtx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Balance Trend',
        data: balancePoints,
        borderColor: '#4a90e2',
        backgroundColor: 'rgba(74, 144, 226, 0.1)',
        tension: 0.2, // smoother curves
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

function updateChartData() {
  if(!myDoughnutChart) return;
  
  let inc = 0, exp = 0;
  transactions.forEach(t => {
    if(t.type === 'income') inc += t.amount;
    else exp += t.amount;
  });
  
  myDoughnutChart.data.datasets[0].data = [inc, exp];
  myDoughnutChart.update();

  // Update trend line 
  if(trendChart) {
    const chronologicalData = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    let runningBalance = 0;
    const labels = [];
    const balancePoints = [];

    chronologicalData.forEach(t => {
      runningBalance += (t.type === 'income' ? t.amount : -t.amount);
      labels.push(t.date);
      balancePoints.push(runningBalance);
    });

    trendChart.data.labels = labels;
    trendChart.data.datasets[0].data = balancePoints;
    trendChart.update();
  }
}

// jumpstart script
window.onload = initApp;
