document.addEventListener('DOMContentLoaded', () => {
    const username = document.getElementById('username');
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');
    const showLoginBtn = document.getElementById('showLoginBtn');
    const showRegisterBtn = document.getElementById('showRegisterBtn');
    const registerFormContainer = document.getElementById(
        'registerFormContainer'
    );
    const loginBtn = document.getElementById('loginBtn');
    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    const URL = 'http://localhost:5000';
    const registerBtn = document.getElementById('registerBtn');
    const loginFormContainer = document.getElementById('loginFormContainer');
    showLoginBtn.addEventListener('click', () => {
        registerFormContainer.style.display = 'none';
        loginFormContainer.style.display = 'block';
    });
    showRegisterBtn.addEventListener('click', () => {
        registerFormContainer.style.display = 'block';
        loginFormContainer.style.display = 'none';
    });
    registerBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        if (password.value == confirmPassword.value) {
            try {
                const person = {
                    name: username.value,
                    email: email.value,
                    password: password.value,
                };
                const response = await fetch(`${URL}/user`, {
                    method: 'POST',
                    body: JSON.stringify(person),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                if (response.ok) {
                    alert('Регистрация успешна');
                } else {
                    alert('Регистрация не удачна!');
                }
            } catch (error) {
                console.error('Ошибка', error);
            }
        } else {
            alert('Пароли не совпадают');
        }
    });
    loginBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const user = {
            email: loginEmail.value,
            password: loginPassword.value,
        };
        try {
            const response = await fetch(`${URL}/user/login`, {
                method: 'POST',
                body: JSON.stringify(user),
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        } catch (error) {
            console.error('Ошибка', error);
        }
    });
});
