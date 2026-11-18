// Требования к паролю — те же, что указаны на странице и проверяются на сервере
const PASSWORD_RULES = [
    { id: 'lengthReq', test: (p) => p.length >= 8 },
    { id: 'numberReq', test: (p) => /\d/.test(p) },
    { id: 'specialReq', test: (p) => /[!@#$%^&*]/.test(p) },
];

function checkPassword(password) {
    return PASSWORD_RULES.map((rule) => ({
        id: rule.id,
        ok: rule.test(password),
    }));
}

document.addEventListener('DOMContentLoaded', async () => {
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    const submitBtn = document.getElementById('submitBtn');
    const strengthBar = document.getElementById('strengthBar');

    // Подсветка требований и полоска надёжности при вводе
    function updateIndicators() {
        const results = checkPassword(newPassword.value);
        let passed = 0;
        results.forEach(({ id, ok }) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.classList.toggle('valid', ok);
            el.classList.toggle('invalid', !ok && newPassword.value !== '');
            if (ok) passed++;
        });
        strengthBar.style.width = `${(passed / results.length) * 100}%`;
        strengthBar.style.background =
            passed === results.length
                ? '#27ae60'
                : passed === 2
                ? '#f39c12'
                : '#e74c3c';
    }
    newPassword.addEventListener('input', updateIndicators);
    updateIndicators();

    submitBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        if (!newPassword.value) {
            alert('Введите новый пароль');
            return;
        }
        if (checkPassword(newPassword.value).some((r) => !r.ok)) {
            alert(
                'Пароль должен быть не короче 8 символов, содержать цифру и специальный символ (!@#$%^&*)'
            );
            return;
        }
        if (newPassword.value != confirmPassword.value) {
            alert('Пароли не совпадают');
            return;
        }
        try {
            const response = await fetch('/user/switch-password', {
                method: 'POST',
                body: JSON.stringify({
                    token: token,
                    password: newPassword.value,
                }),
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            if (data.success) {
                alert('Вы изменили пароль, переходим на страницу логина');
                setTimeout(() => {
                    window.location.href = '/index.html';
                }, 3000);
            } else {
                alert(data.answer || 'Не удалось сменить пароль');
            }
        } catch (error) {
            console.error(error);
            alert('Не удалось сменить пароль');
        }
    });
});
