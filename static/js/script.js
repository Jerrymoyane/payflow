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