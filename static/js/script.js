document.addEventListener('DOMContentLoaded', function () {

    // ---------- NAVBAR LOGIN STATE ----------
    // Shows Dashboard/Wallet/etc links + Logout if logged in, Login/Register if not
    const navLoggedIn = document.getElementById('nav-loggedin');
    const navLoggedOut = document.getElementById('nav-loggedout');
    const navLogoutAction = document.getElementById('nav-logout-action');

    if (token) {
        if (navLoggedIn) navLoggedIn.style.display = 'flex';
        if (navLoggedOut) navLoggedOut.style.display = 'none';
        if (navLogoutAction) navLogoutAction.style.display = 'flex';
    }

    const logoutBtn = document.getElementById('logout-btn');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login/';
        });
    }
    // ---------- REGISTER ----------
    // ...keep the rest of your existing code here

    // ---------- DASHBOARD ----------
    const walletBalanceEl = document.getElementById('wallet-balance');
    if (walletBalanceEl && requireAuth()) {
        apiGet('/api/users/me/')
            .then(user => {
                document.getElementById('welcome-message').textContent = 'Welcome, ' + user.first_name;
                document.getElementById('account-email').textContent = 'Email: ' + user.email;
                document.getElementById('account-phone').textContent = 'Phone: ' + user.phone_number;
            })
            .catch(() => {
                localStorage.removeItem('access_token');
                window.location.href = '/login/';
            });

        apiGet('/api/wallet/').then(wallet => {
            walletBalanceEl.textContent = wallet.currency + ' ' + wallet.balance;
        });

        apiGet('/api/transactions/').then(data => {
            renderTransactionRows(document.getElementById('transactions-body'), extractList(data));
        });
    }

    // ---------- WALLET PAGE ----------
    const depositForm = document.getElementById('deposit-form');
    if (depositForm && requireAuth()) {
        const balanceEl = document.getElementById('wallet-page-balance');

        async function loadBalance() {
            const wallet = await apiGet('/api/wallet/');
            balanceEl.textContent = wallet.currency + ' ' + wallet.balance;
        }

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
                document.getElementById(amountInputId).value = '';
                loadBalance();
            } catch (err) {
                messageBox.textContent = 'Something went wrong.';
                messageBox.classList.add('form-message-error');
            }
        }

        loadBalance();

        depositForm.addEventListener('submit', function (e) {
            e.preventDefault();
            submitTransaction('/api/wallet/deposit/', 'deposit-amount', 'deposit-message');
        });

        document.getElementById('withdraw-form').addEventListener('submit', function (e) {
            e.preventDefault();
            submitTransaction('/api/wallet/withdraw/', 'withdraw-amount', 'withdraw-message');
        });
    }

    // ---------- PAYMENTS PAGE ----------
    const airtimeForm = document.getElementById('airtime-form');
    if (airtimeForm && requireAuth()) {

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

        document.getElementById('data-form').addEventListener('submit', function (e) {
            e.preventDefault();
            submitPayment('/api/payments/data/', {
                phone_number: document.getElementById('data-phone').value,
                network: document.getElementById('data-network').value,
                amount: document.getElementById('data-amount').value
            }, 'data-message');
        });

        document.getElementById('electricity-form').addEventListener('submit', function (e) {
            e.preventDefault();
            submitPayment('/api/payments/electricity/', {
                meter_number: document.getElementById('electricity-meter').value,
                provider: 'Eskom',
                amount: document.getElementById('electricity-amount').value
            }, 'electricity-message');
        });
    }

    // ---------- TRANSACTIONS PAGE ----------
    const fullTransactionsBody = document.getElementById('full-transactions-body');
    if (fullTransactionsBody && requireAuth()) {

        async function loadTransactions() {
            fullTransactionsBody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';

            const type = document.getElementById('filter-type').value;
            const status = document.getElementById('filter-status').value;
            const params = new URLSearchParams();
            if (type) params.append('type', type);
            if (status) params.append('status', status);

            try {
                const data = await apiGet('/api/transactions/?' + params.toString());
                renderTransactionRows(fullTransactionsBody, extractList(data));
            } catch (err) {
                fullTransactionsBody.innerHTML = '<tr><td colspan="5">Failed to load transactions.</td></tr>';
            }
        }

        document.getElementById('filter-apply').addEventListener('click', loadTransactions);
        document.getElementById('filter-clear').addEventListener('click', function () {
            document.getElementById('filter-type').value = '';
            document.getElementById('filter-status').value = '';
            loadTransactions();
        });

        loadTransactions();
    }

    // ---------- PROFILE PAGE ----------
    const profileFirstName = document.getElementById('profile-first-name');
    if (profileFirstName && requireAuth()) {
        apiGet('/api/users/me/').then(user => {
            document.getElementById('profile-first-name').textContent = user.first_name;
            document.getElementById('profile-last-name').textContent = user.last_name;
            document.getElementById('profile-email').textContent = user.email;
            document.getElementById('profile-phone').textContent = user.phone_number;
            document.getElementById('profile-created').textContent = new Date(user.created_at).toLocaleDateString();
        }).catch(() => {
            localStorage.removeItem('access_token');
            window.location.href = '/login/';
        });
    }

});