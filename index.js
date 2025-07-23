document.addEventListener('DOMContentLoaded', () => {
    const showLoginBtn = document.getElementById('showLoginBtn');
    const showRegisterBtn = document.getElementById('showRegisterBtn');
    const registerFormContainer = document.getElementById(
        'registerFormContainer'
    );
    const loginFormContainer = document.getElementById('loginFormContainer');
    showLoginBtn.addEventListener('click', () => {
        registerFormContainer.style.display = 'none';
        loginFormContainer.style.display = 'block';
    });
    showRegisterBtn.addEventListener('click', () => {
        registerFormContainer.style.display = 'block';
        loginFormContainer.style.display = 'none';
    });
});
