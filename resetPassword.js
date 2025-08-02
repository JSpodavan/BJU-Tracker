document.addEventListener('DOMContentLoaded', async () => {
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        console.log(token);
        console.log(newPassword.value);
        if (newPassword.value == confirmPassword.value) {
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
                alert(data.answer);
            }
        }
    });
});
