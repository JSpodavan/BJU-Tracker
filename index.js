document.addEventListener('DOMContentLoaded', async () => {
    const username = document.getElementById('username');
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');
    const showLoginBtn = document.getElementById('showLoginBtn');
    const showRegisterBtn = document.getElementById('showRegisterBtn');
    const registerFormContainer = document.getElementById(
        'registerFormContainer'
    );
    const profilePage = document.getElementById('profilePage');
    const loginBtn = document.getElementById('loginBtn');
    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    const URL = 'http://localhost:5000';
    const registerBtn = document.getElementById('registerBtn');
    const loginFormContainer = document.getElementById('loginFormContainer');
    const profileUsername = document.getElementById('profileUsername');
    const profileEmail = document.getElementById('profileEmail');
    const logoutBtn = document.getElementById('logoutBtn');
    const productsBtn = document.getElementById('productsBtn');
    const productsPage = document.getElementById('productsPage');
    const searchBtn = document.getElementById('searchBtn');
    const productSearchSpace = document.getElementById('productSearch');

    async function checkAuth() {
        const response = await fetch(`${URL}/user/auth`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (response.ok) {
            const data = await response.json();
            registerFormContainer.style.display = 'none';
            profilePage.style.display = 'block';
            profileUsername.textContent = data.user.name;
            profileEmail.textContent = data.user.email;
        }
    }
    await checkAuth();
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
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                const data = await response.json();
                if (response.ok) {
                    alert('Вы успешно зарегистрировались');
                    registerFormContainer.style.display = 'none';
                    profilePage.style.display = 'block';
                } else {
                    if (data.errors) {
                        alert(data.errors.map((err) => err.msg).join('\n'));
                    } else if (data.message) {
                        alert(data.message);
                    } else {
                        alert('Произошла неизвестная ошибка');
                    }
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
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();

            if (response.ok) {
                alert('Вы успешно вошли');
                registerFormContainer.style.display = 'none';
                loginFormContainer.style.display = 'none';
                profilePage.style.display = 'block';
                profileUsername.textContent = data.name;
                profileEmail.textContent = data.email;
            } else {
                if (data.errors) {
                    alert(data.errors.map((err) => err.msg).join('\n'));
                } else if (data.message) {
                    alert(data.message);
                } else {
                    alert('Произошла неизвестная ошибка');
                }
            }
        } catch (error) {
            console.error('Ошибка', error);
        }
    });
    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const response = await fetch(`${URL}/user/logout`, {
            method: 'POST',
            credentials: 'include',
        });
        if (response.ok) {
            registerFormContainer.style.display = 'block';
            profilePage.style.display = 'none';
        }
    });
    productsBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        profilePage.style.display = 'none';
        productsPage.style.display = 'block';
    });
    searchBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const product = { product: productSearchSpace.value };
        try {
            const response = await fetch(`${URL}/api/search`, {
                method: 'POST',
                body: JSON.stringify(product),
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
        } catch (error) {
            console.error(error);
        }
    });
});
