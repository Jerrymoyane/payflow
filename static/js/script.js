// This file will hold JavaScript that talks to our Django REST API.
// For now it's empty - we'll add login/register logic here in the next step,
// once base.html and home.html are confirmed working.
console.log("PayFlow frontend loaded.");


// This runs after the page's HTML is fully loaded
document.addEventListener('DOMContentLoaded', function () {

    // ---------- REGISTER ----------
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async function (e) {
            e.preventDefault(); // stop the browser's default full-page form submit

            const errorBox = document.getElementById('register-error');
            errorBox.textContent = '';

            const data = {
                first_name: document.getElementById('first_name').value,
                last_name: document.getElementById('last_name').value,
                email: document.getElementById('email').value,
                phone_number: document.getElementById('phone_number').value,
                password: document.getElementById('password').value,
            };

            try {
                const response = await fetch('/api/auth/register/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });

                const result = await response.json();

                if (!response.ok) {
                    // DRF errors look like {"email": ["already exists"]} - grab the first message
                    const firstError = Object.values(result)[0];
                    errorBox.textContent = Array.isArray(firstError) ? firstError[0] : 'Registration failed.';
                    return;
                }

                // Registration succeeded - send them to login
                window.location.href = '/login/';

            } catch (err) {
                errorBox.textContent = 'Something went wrong. Please try again.';
            }
        });
    }

    // ---------- LOGIN ----------
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const errorBox = document.getElementById('login-error');
            errorBox.textContent = '';

            const data = {
                email: document.getElementById('email').value,
                password: document.getElementById('password').value,
            };

            try {
                const response = await fetch('/api/auth/login/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });

                const result = await response.json();

                if (!response.ok) {
                    errorBox.textContent = 'Invalid email or password.';
                    return;
                }

                // Store both tokens in localStorage so other pages can use them
                localStorage.setItem('access_token', result.access);
                localStorage.setItem('refresh_token', result.refresh);

                // Logged in - go to dashboard (we'll build this next)
                window.location.href = '/dashboard/';

            } catch (err) {
                errorBox.textContent = 'Something went wrong. Please try again.';
            }
        });
    }

});


// ---------- DASHBOARD ----------
const walletBalanceEl = document.getElementById('wallet-balance');
if (walletBalanceEl) {  // only run this code if we're actually on the dashboard page

    const token = localStorage.getItem('access_token');

    // No token at all? Not logged in - send them to login immediately.
    if (!token) {
        window.location.href = '/login/';
    } else {

        // A small helper so we don't repeat the Authorization header every time
        async function apiGet(url) {
            const response = await fetch(url, {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (!response.ok) {
                throw new Error('Request failed: ' + url);
            }
            return response.json();
        }

        // Load profile info
        apiGet('/api/users/me/')
            .then(user => {
                document.getElementById('welcome-message').textContent = 'Welcome, ' + user.first_name;
                document.getElementById('account-email').textContent = 'Email: ' + user.email;
                document.getElementById('account-phone').textContent = 'Phone: ' + user.phone_number;
            })
            .catch(() => {
                // Token likely expired or invalid - send back to login
                localStorage.removeItem('access_token');
                window.location.href = '/login/';
            });

        // Load wallet balance
        apiGet('/api/wallet/')
            .then(wallet => {
                walletBalanceEl.textContent = wallet.currency + ' ' + wallet.balance;
            });

        // Load recent transactions
        apiGet('/api/transactions/')
            .then(transactions => {
                const tbody = document.getElementById('transactions-body');
                tbody.innerHTML = ''; // clear the "Loading..." row

                if (transactions.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="5">No transactions yet.</td></tr>';
                    return;
                }

                // {% for %} in Django templates loops server-side;
                // here we're doing the same idea but in JavaScript, client-side,
                // since this data arrives after the page has already loaded.
                transactions.forEach(txn => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${txn.reference}</td>
                        <td>${txn.type}</td>
                        <td>${txn.amount}</td>
                        <td><span class="badge badge-${txn.status.toLowerCase()}">${txn.status}</span></td>
                        <td>${new Date(txn.created_at).toLocaleDateString()}</td>
                    `;
                    tbody.appendChild(row);
                });
            });
    }
}



// ---------- WALLET PAGE ----------
const depositForm = document.getElementById('deposit-form');
if (depositForm) {  // only runs on the wallet page

    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = '/login/';
    } else {

        const balanceEl = document.getElementById('wallet-page-balance');

        // Reusable function to fetch and display the current balance
        async function loadBalance() {
            const response = await fetch('/api/wallet/', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const wallet = await response.json();
            balanceEl.textContent = wallet.currency + ' ' + wallet.balance;
        }

        // Shared function for both deposit and withdraw, since they
        // work identically apart from the URL they call
        async function submitTransaction(url, amountInputId, messageBoxId) {
            const messageBox = document.getElementById(messageBoxId);
            const amount = document.getElementById(amountInputId).value;
            messageBox.textContent = '';
            messageBox.className = 'form-message';

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({ amount: amount })
                });

                const result = await response.json();

                if (!response.ok) {
                    messageBox.textContent = result.detail || 'Transaction failed.';
                    messageBox.classList.add('form-message-error');
                    return;
                }

                messageBox.textContent = 'Success! Reference: ' + result.reference;
                messageBox.classList.add('form-message-success');

                document.getElementById(amountInputId).value = '';  // clear the input
                loadBalance();  // refresh the displayed balance immediately

            } catch (err) {
                messageBox.textContent = 'Something went wrong.';
                messageBox.classList.add('form-message-error');
            }
        }

        // Load the balance as soon as the page opens
        loadBalance();

        depositForm.addEventListener('submit', function (e) {
            e.preventDefault();
            submitTransaction('/api/wallet/deposit/', 'deposit-amount', 'deposit-message');
        });

        const withdrawForm = document.getElementById('withdraw-form');
        withdrawForm.addEventListener('submit', function (e) {
            e.preventDefault();
            submitTransaction('/api/wallet/withdraw/', 'withdraw-amount', 'withdraw-message');
        });
    }
}


// ---------- PAYMENTS PAGE ----------
const airtimeForm = document.getElementById('airtime-form');
if (airtimeForm) {  // only runs on the payments page

    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = '/login/';
    } else {

        // Shared submit helper for all three payment forms
        async function submitPayment(url, payload, messageBoxId) {
            const messageBox = document.getElementById(messageBoxId);
            messageBox.textContent = '';
            messageBox.className = 'form-message';

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();

                if (!response.ok) {
                    const firstError = result.detail || Object.values(result)[0];
                    messageBox.textContent = Array.isArray(firstError) ? firstError[0] : firstError;
                    messageBox.classList.add('form-message-error');
                    return;
                }

                messageBox.textContent = 'Success! Reference: ' + result.reference + ' — New balance: ' + result.new_balance;
                messageBox.classList.add('form-message-success');

            } catch (err) {
                messageBox.textContent = 'Something went wrong.';
                messageBox.classList.add('form-message-error');
            }
        }

        airtimeForm.addEventListener('submit', function (e) {
            e.preventDefault();
            submitPayment('/api/payments/airtime/', {
                phone_number: document.getElementById('airtime-phone').value,
                network: document.getElementById('airtime-network').value,
                amount: document.getElementById('airtime-amount').value
            }, 'airtime-message');
        });

        const dataForm = document.getElementById('data-form');
        dataForm.addEventListener('submit', function (e) {
            e.preventDefault();
            submitPayment('/api/payments/data/', {
                phone_number: document.getElementById('data-phone').value,
                network: document.getElementById('data-network').value,
                amount: document.getElementById('data-amount').value
            }, 'data-message');
        });

        const electricityForm = document.getElementById('electricity-form');
        electricityForm.addEventListener('submit', function (e) {
            e.preventDefault();
            submitPayment('/api/payments/electricity/', {
                meter_number: document.getElementById('electricity-meter').value,
                provider: 'Eskom',  // TEMP: backend currently requires this field - see note below
                amount: document.getElementById('electricity-amount').value
            }, 'electricity-message');
        });
    }
}

// ---------- TRANSACTIONS PAGE ----------
const fullTransactionsBody = document.getElementById('full-transactions-body');
if (fullTransactionsBody) {  // only runs on the transactions page

    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = '/login/';
    } else {

        async function loadTransactions() {
            fullTransactionsBody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';

            const type = document.getElementById('filter-type').value;
            const status = document.getElementById('filter-status').value;

            const params = new URLSearchParams();
            if (type) params.append('type', type);
            if (status) params.append('status', status);

            const response = await fetch('/api/transactions/?' + params.toString(), {
                headers: { 'Authorization': 'Bearer ' + token }
            });

            if (!response.ok) {
                fullTransactionsBody.innerHTML = '<tr><td colspan="5">Failed to load transactions.</td></tr>';
                return;
            }

            const transactions = await response.json();
            fullTransactionsBody.innerHTML = '';

            if (transactions.length === 0) {
                fullTransactionsBody.innerHTML = '<tr><td colspan="5">No transactions found.</td></tr>';
                return;
            }

            transactions.forEach(txn => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${txn.reference}</td>
                    <td>${txn.type}</td>
                    <td>${txn.amount}</td>
                    <td><span class="badge badge-${txn.status.toLowerCase()}">${txn.status}</span></td>
                    <td>${new Date(txn.created_at).toLocaleDateString()}</td>
                `;
                fullTransactionsBody.appendChild(row);
            });
        }

        document.getElementById('filter-apply').addEventListener('click', loadTransactions);
        document.getElementById('filter-clear').addEventListener('click', function () {
            document.getElementById('filter-type').value = '';
            document.getElementById('filter-status').value = '';
            loadTransactions();
        });

        loadTransactions();
    }
}