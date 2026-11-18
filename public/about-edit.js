async function loadAboutInfo() {
    try {
        const response = await fetch('/api/getUserProfile');
        const data = await response.json();
        if (data.about) {
            document.getElementById('profileAbout').textContent = data.about;
        }
    } catch (error) {
        console.error('Error loading about info:', error);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    loadAboutInfo();

    const editBtn = document.getElementById('editAboutBtn');
    const aboutText = document.getElementById('profileAbout');
    const aboutTextarea = document.getElementById('aboutTextarea');
    const editActions = document.querySelector('.edit-actions');
    const saveBtn = document.getElementById('saveAboutBtn');
    const cancelBtn = document.getElementById('cancelAboutBtn');

    let originalText = '';

    if (editBtn) {
        editBtn.addEventListener('click', function () {
            originalText = aboutText.textContent;
            aboutTextarea.value = originalText;

            aboutText.style.display = 'none';
            aboutTextarea.style.display = 'block';
            editActions.style.display = 'flex';
            editBtn.style.display = 'none';

            aboutTextarea.focus();
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', async function () {
            const newText = aboutTextarea.value.trim();

            try {
                const response = await fetch('/api/updateAbout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ about: newText }),
                });

                if (response.ok) {
                    aboutText.textContent = newText;
                    exitEditMode();
                } else {
                    alert('Ошибка при сохранении');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Ошибка при сохранении');
            }
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', function () {
            exitEditMode();
        });
    }

    function exitEditMode() {
        aboutText.style.display = 'block';
        aboutTextarea.style.display = 'none';
        editActions.style.display = 'none';
        editBtn.style.display = 'flex';
    }
});
