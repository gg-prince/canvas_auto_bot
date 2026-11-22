const form = document.querySelector('#login-form');
const passwordInput = document.querySelector('#password');
const togglePassword = document.querySelector('#toggle-password');
const message = document.querySelector('#login-message');
const loginButton = form.querySelector('button[type="submit"]');

// Show/hide password.
togglePassword.addEventListener('click', () => {

    const hidden = passwordInput.type === 'password';

    passwordInput.type = hidden ? 'text' : 'password';

    togglePassword.textContent = hidden ? 'Hide' : 'Show';

});

// Login.
form.addEventListener('submit', async (event) => {

    event.preventDefault();

    message.textContent = '';
    message.className = 'message';

    loginButton.disabled = true;
    loginButton.innerHTML = 'Signing in…';

    try {

        const response = await fetch('/api/admin/login', {

            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({
                password: passwordInput.value
            })

        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Login failed.');
        }

        window.location.href = '/admin/dashboard.html';

    } catch (error) {

        message.textContent = error.message;
        message.classList.add('error');

    } finally {

        loginButton.disabled = false;
        loginButton.innerHTML = 'Sign in <span>→</span>';

    }

});
