/**
 * A2A Knowledge Marketplace - Dashboard Application
 * Real-time metrics with WebSocket and Chart.js
 */

// ============ Configuration ============

const CONFIG = {
    apiUrl: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:4021'
        : 'https://a2a-marketplace.onrender.com',
    wsUrl: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'ws://localhost:4022'
        : 'wss://a2a-marketplace.onrender.com',
    pollingInterval: 5000, // 5 seconds fallback
    reconnectInterval: 3000,
};

// ============ State ============

let socket = null;
let isConnected = false;
let requestsChart = null;
let endpointChart = null;
let pollingTimer = null;

// ============ Theme Management ============

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    // Update chart colors
    updateChartColors();
}

// ============ WebSocket Connection ============

function connectWebSocket() {
    try {
        socket = new WebSocket(CONFIG.wsUrl);

        socket.onopen = () => {
            console.log('📡 WebSocket connected');
            updateConnectionStatus(true);
            isConnected = true;

            // Stop polling if active
            if (pollingTimer) {
                clearInterval(pollingTimer);
                pollingTimer = null;
            }
        };

        socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                handleWebSocketMessage(message);
            } catch (error) {
                console.error('Failed to parse WebSocket message:', error);
            }
        };

        socket.onclose = () => {
            console.log('📡 WebSocket disconnected');
            updateConnectionStatus(false);
            isConnected = false;
            startPolling();
            setTimeout(connectWebSocket, CONFIG.reconnectInterval);
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            socket.close();
        };
    } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        startPolling();
    }
}

function handleWebSocketMessage(message) {
    switch (message.type) {
        case 'connected':
            console.log('WebSocket:', message.message);
            // Fetch initial data
            fetchMetrics();
            break;

        case 'transaction':
            addTransaction(message.data);
            break;

        case 'metrics':
            updateDashboard(message.data);
            break;

        default:
            console.log('Unknown message type:', message.type);
    }
}

function updateConnectionStatus(connected) {
    const statusEl = document.getElementById('connectionStatus');
    const dotEl = statusEl.querySelector('.status-dot');
    const textEl = statusEl.querySelector('.status-text');

    if (connected) {
        dotEl.classList.remove('disconnected');
        dotEl.classList.add('connected');
        textEl.textContent = 'Connected';
    } else {
        dotEl.classList.remove('connected');
        dotEl.classList.add('disconnected');
        textEl.textContent = 'Disconnected';
    }
}

// ============ Polling Fallback ============

function startPolling() {
    if (pollingTimer) return;

    console.log('📊 Starting polling fallback');
    pollingTimer = setInterval(fetchMetrics, CONFIG.pollingInterval);
    fetchMetrics(); // Immediate first fetch
}

async function fetchMetrics() {
    try {
        const response = await fetch(`${CONFIG.apiUrl}/api/metrics/summary`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        updateDashboard(data.metrics);
    } catch (error) {
        console.error('Failed to fetch metrics:', error);
    }
}

// ============ Dashboard Updates ============

function updateDashboard(metrics) {
    if (!metrics) return;

    // Update stat cards
    document.getElementById('totalRequests').textContent = metrics.totalRequests || 0;
    document.getElementById('successfulRequests').textContent = metrics.successfulRequests || 0;
    document.getElementById('failedRequests').textContent = metrics.failedRequests || 0;
    document.getElementById('totalRevenue').textContent = metrics.revenueFormatted || '0.000000 USDC';
    document.getElementById('uniqueAgents').textContent = metrics.uniqueAgents || 0;
    document.getElementById('requestsPerMinute').textContent = metrics.requestsPerMinute || 0;

    // Update endpoints
    updateEndpoints(metrics.endpointMetrics || []);

    // Update transactions
    updateTransactions(metrics.recentTransactions || []);

    // Update charts
    updateCharts(metrics.hourlyData || [], metrics.endpointMetrics || []);
}

function updateEndpoints(endpoints) {
    const grid = document.getElementById('endpointsGrid');

    if (endpoints.length === 0) {
        grid.innerHTML = '<p class="text-muted">No endpoint data yet</p>';
        return;
    }

    grid.innerHTML = endpoints.map(ep => `
    <div class="endpoint-card">
      <div class="endpoint-name">${ep.endpoint}</div>
      <div class="endpoint-stats">
        <div class="endpoint-stat">
          <span class="endpoint-stat-label">Requests</span>
          <span class="endpoint-stat-value">${ep.totalRequests}</span>
        </div>
        <div class="endpoint-stat">
          <span class="endpoint-stat-label">Success</span>
          <span class="endpoint-stat-value" style="color: var(--success)">${ep.successfulRequests}</span>
        </div>
        <div class="endpoint-stat">
          <span class="endpoint-stat-label">Failed</span>
          <span class="endpoint-stat-value" style="color: var(--error)">${ep.failedRequests}</span>
        </div>
        <div class="endpoint-stat">
          <span class="endpoint-stat-label">Revenue</span>
          <span class="endpoint-stat-value">${(ep.totalRevenue / 1000000).toFixed(4)}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function updateTransactions(transactions) {
    const tbody = document.getElementById('transactionsBody');

    if (transactions.length === 0) {
        tbody.innerHTML = `
      <tr class="empty-row">
        <td colspan="5">No transactions yet. Start an AI agent to see data flow!</td>
      </tr>
    `;
        return;
    }

    tbody.innerHTML = transactions.map(tx => {
        const time = new Date(tx.timestamp).toLocaleTimeString();
        const statusClass = tx.status === 'success' ? 'success' : tx.status === 'failed' ? 'failed' : 'pending';
        const statusIcon = tx.status === 'success' ? '✅' : tx.status === 'failed' ? '❌' : '⏳';

        return `
      <tr>
        <td>${time}</td>
        <td><span class="endpoint-tag">${tx.endpoint}</span></td>
        <td><span class="agent-address">${tx.agentAddress.slice(0, 10)}...</span></td>
        <td><span class="amount">${tx.amountFormatted}</span></td>
        <td><span class="status-badge ${statusClass}">${statusIcon} ${tx.status}</span></td>
      </tr>
    `;
    }).join('');
}

function addTransaction(tx) {
    const tbody = document.getElementById('transactionsBody');

    // Remove empty row if present
    const emptyRow = tbody.querySelector('.empty-row');
    if (emptyRow) {
        emptyRow.remove();
    }

    // Create new row
    const time = new Date(tx.timestamp).toLocaleTimeString();
    const statusClass = tx.status === 'success' ? 'success' : tx.status === 'failed' ? 'failed' : 'pending';
    const statusIcon = tx.status === 'success' ? '✅' : tx.status === 'failed' ? '❌' : '⏳';

    const row = document.createElement('tr');
    row.innerHTML = `
    <td>${time}</td>
    <td><span class="endpoint-tag">${tx.endpoint}</span></td>
    <td><span class="agent-address">${tx.agentAddress.slice(0, 10)}...</span></td>
    <td><span class="amount">${tx.amountFormatted}</span></td>
    <td><span class="status-badge ${statusClass}">${statusIcon} ${tx.status}</span></td>
  `;

    // Add animation
    row.style.opacity = '0';
    row.style.transform = 'translateX(-20px)';
    tbody.insertBefore(row, tbody.firstChild);

    // Trigger animation
    requestAnimationFrame(() => {
        row.style.transition = 'all 0.3s ease';
        row.style.opacity = '1';
        row.style.transform = 'translateX(0)';
    });

    // Keep only last 20 rows
    while (tbody.children.length > 20) {
        tbody.removeChild(tbody.lastChild);
    }
}

// ============ Charts ============

function initCharts() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    // Requests & Revenue Chart
    const requestsCtx = document.getElementById('requestsChart').getContext('2d');
    requestsChart = new Chart(requestsCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Requests',
                    data: [],
                    borderColor: '#7c3aed',
                    backgroundColor: 'rgba(124, 58, 237, 0.1)',
                    fill: true,
                    tension: 0.4,
                    yAxisID: 'y',
                },
                {
                    label: 'Revenue (USDC)',
                    data: [],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4,
                    yAxisID: 'y1',
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    labels: { color: textColor },
                },
            },
            scales: {
                x: {
                    ticks: { color: textColor },
                    grid: { color: gridColor },
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    ticks: { color: textColor },
                    grid: { color: gridColor },
                    title: {
                        display: true,
                        text: 'Requests',
                        color: textColor,
                    },
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    ticks: { color: textColor },
                    grid: { drawOnChartArea: false },
                    title: {
                        display: true,
                        text: 'Revenue (USDC)',
                        color: textColor,
                    },
                },
            },
        },
    });

    // Endpoint Chart
    const endpointCtx = document.getElementById('endpointChart').getContext('2d');
    endpointChart = new Chart(endpointCtx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#7c3aed',
                    '#a855f7',
                    '#ec4899',
                    '#f43f5e',
                    '#f97316',
                ],
                borderWidth: 0,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: textColor },
                },
            },
        },
    });
}

function updateCharts(hourlyData, endpointMetrics) {
    // Update requests chart
    if (requestsChart && hourlyData.length > 0) {
        requestsChart.data.labels = hourlyData.map(d => d.hour);
        requestsChart.data.datasets[0].data = hourlyData.map(d => d.requests);
        requestsChart.data.datasets[1].data = hourlyData.map(d => d.revenue);
        requestsChart.update('none');
    }

    // Update endpoint chart
    if (endpointChart && endpointMetrics.length > 0) {
        endpointChart.data.labels = endpointMetrics.map(e => e.endpoint.split('/').pop());
        endpointChart.data.datasets[0].data = endpointMetrics.map(e => e.totalRevenue / 1000000);
        endpointChart.update('none');
    }
}

function updateChartColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    if (requestsChart) {
        requestsChart.options.scales.x.ticks.color = textColor;
        requestsChart.options.scales.x.grid.color = gridColor;
        requestsChart.options.scales.y.ticks.color = textColor;
        requestsChart.options.scales.y.grid.color = gridColor;
        requestsChart.options.scales.y.title.color = textColor;
        requestsChart.options.scales.y1.ticks.color = textColor;
        requestsChart.options.scales.y1.title.color = textColor;
        requestsChart.options.plugins.legend.labels.color = textColor;
        requestsChart.update('none');
    }

    if (endpointChart) {
        endpointChart.options.plugins.legend.labels.color = textColor;
        endpointChart.update('none');
    }
}

// ============ Event Listeners ============

document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme
    initTheme();

    // Initialize charts
    initCharts();

    // Connect WebSocket
    connectWebSocket();

    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', fetchMetrics);

    // Initial fetch
    fetchMetrics();
});

// ============ Visibility Change ============

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        fetchMetrics();

        if (!isConnected) {
            connectWebSocket();
        }
    }
});
