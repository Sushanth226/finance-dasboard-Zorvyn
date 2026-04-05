# Simple Finance Dashboard

A clean and interactive frontend dashboard prototype for tracking personal finances, built specifically to evaluate frontend structure, UI/UX design, and state management.

## Setup Instructions
1. Download or clone this repository.
2. Open `index.html` directly in your browser. (No node_modules, no build steps required!)
   - *Alternative: Serve using a simple local server like Python's `python -m http.server 8000`.*

## Features & Requirements Met
- **Dashboard Overview**: Displays total balance, income, and expenses. Includes a categorical Doughnut chart (Income vs Expense) and a time-based Line chart (Balance Trend).
- **Transactions Section**: Searchable table displaying transaction lists with Date, Category, Type, and Amount. Gracefully handles Empty States if all items are deleted.
- **Role Based UI**: Simulated frontend RBAC. Switch to "Viewer" to restrict access; switch to "Admin" to view Delete and Add actions.
- **Insights**: Computes dynamic insights such as highest expense category, monthly comparisons against historical data, and personalized budgeting observations.
- **State Management**: Built with plain JavaScript arrays and hooks into `localStorage` for reliable data persistence on browser refresh.
- **Optional Enhancements**: Includes a functional Dark Mode toggle, full CSS layout responsiveness, and localized data persistence via the Web Storage API.

## Technical Approach
The focus here was "simplicity, clarity, and intentionality." Rather than unnecessarily depending on heavy abstraction frameworks like React/Redux for a simple UI, the app utilizes Vanilla HTML/CSS/JS. This demonstrates a deep understanding of core DOM manipulation, manual state synchronization, and UI structuring. Chart.js was introduced via a CDN to fulfill the dual visualization criteria smoothly and beautifully.
