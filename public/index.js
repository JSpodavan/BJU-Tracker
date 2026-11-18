// Экранирование для вставки в innerHTML
function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
// Безопасный строковый аргумент для onclick="fn(...)": названия с кавычками
// (например, chef's salad или «Мамин "борщ"») раньше ломали обработчик
function jsArg(value) {
    return escapeHtml(JSON.stringify(String(value ?? '')));
}

async function removeFromFavorites(productName) {
    try {
        const response = await fetch(
            `/api/deleteFavourite`,
            {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: productName,
                }),
            }
        );

        const data = await response.json();
        console.log(data);

        if (response.ok) {
            let products = localStorage.getItem('products');
            products = await JSON.parse(products);
            let cards;
            if (
                document.querySelector('.list-btn').classList.contains('active')
            ) {
                cards = document.querySelectorAll('.food-card-list');
            } else {
                cards = document.querySelectorAll('.favorite-product-card');
            }
            cards.forEach(async (card) => {
                const cardName = card.querySelector('h3').textContent;
                if (cardName === productName) {
                    card.style.animation = 'fadeOut 0.3s ease';
                    setTimeout(() => {
                        card.remove();

                        let remainingCards = '';
                        // Раньше при отсутствии продукта удалялся первый
                        // элемент списка (index по умолчанию был 0)
                        const index = products.findIndex(
                            (product) => product.name == productName
                        );
                        if (index !== -1) products.splice(index, 1);
                        console.log(products);
                        localStorage.setItem(
                            'products',
                            JSON.stringify(products)
                        );
                        if (
                            document
                                .querySelector('.list-btn')
                                .classList.contains('active')
                        ) {
                            remainingCards =
                                document.querySelectorAll('.food-card-list');
                        } else {
                            remainingCards = document.querySelectorAll(
                                '.favorite-product-card'
                            );
                        }
                        if (remainingCards.length === 0) {
                            document.getElementById(
                                'emptyFavorites'
                            ).style.display = 'block';
                            document.getElementById(
                                'favoritesGrid'
                            ).style.display = 'none';
                        }
                    }, 300);
                }
            });
            const popup_space = document.getElementById('popup-space');
            const popup_text = document.getElementById('popup-text');
            const popup_title = document.getElementById('popup_title');
            popup_title.textContent = 'Продукт успешно удален';
            popup_space.style.display = 'block';
            popup_text.textContent = `Вы успешно удалили ${productName} из избранного`;
        } else {
            alert('Ошибка при удалении из избранного');
        }
    } catch (error) {
        console.error('Error removing from favorites:', error);
        alert('Ошибка при удалении из избранного');
    }
}
async function deleteDish(dishName) {
    const dishCards = document.querySelectorAll('.dish-card');
    const response = await fetch('/api/deleteDish', {
        method: 'DELETE',
        body: JSON.stringify({ name: dishName }),
        headers: {
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) {
        alert('Не удалось удалить блюдо');
        return;
    }

    // Remove dish card from dishes grid
    dishCards.forEach((card) => {
        if (card.querySelector('h4').textContent === dishName) {
            card.remove();
        }
    });

    // Remove corresponding meal-dish elements from weekly meal plan
    const mealDishes = document.querySelectorAll('.meal-dish');
    mealDishes.forEach((mealDish) => {
        if (mealDish.textContent === dishName) {
            mealDish.remove();
        }
    });

    // Пересчитываем итоги недели — удалённое блюдо больше не учитывается
    await loadMealPlanForWeek();
}

async function addToFavorites(ProductName) {
    try {
        const response = await fetch('/api/favourite', {
            method: 'POST',
            body: JSON.stringify({
                name: ProductName,
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const data = await response.json();
        const popup_space = document.getElementById('popup-space');
        const popup_text = document.getElementById('popup-text');
        const popup_title = document.getElementById('popup_title');
        if (data.answer.includes('уже')) {
            popup_title.textContent = 'Произошла ошибка';
        } else {
            popup_title.textContent = 'Продукт успешно добавлен в избранное';
        }
        popup_space.style.display = 'block';
        popup_text.textContent = data.answer;
    } catch (error) {
        console.error(error);
    }
}
function getCurrentWeek() {
    const now = new Date();
    const monday = new Date(now);
    // getDay(): 0 — воскресенье. Раньше в воскресенье бралась уже следующая
    // неделя (now - 0 + 1 = завтрашний понедельник)
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    return monday;
}

function formatWeekRange(startDate) {
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    const options = { day: 'numeric', month: 'short' };
    return `${startDate.toLocaleDateString(
        'ru-RU',
        options
    )} - ${endDate.toLocaleDateString('ru-RU', options)}`;
}

let selectedWeek = getCurrentWeek();

function updateWeeklyNutrition(weeklyTotals) {
    const nutritionDisplay =
        document.getElementById('weeklyNutrition') ||
        createWeeklyNutritionDisplay();
    nutritionDisplay.innerHTML = `
        <span class="nutrition-item">${weeklyTotals.calories} ккал</span>
        <span class="nutrition-item">${weeklyTotals.protein}г белков</span>
        <span class="nutrition-item">${weeklyTotals.fat}г жиров</span>
        <span class="nutrition-item">${weeklyTotals.carbs}г углеводов</span>
    `;
}

function createWeeklyNutritionDisplay() {
    const nutritionDisplay = document.createElement('div');
    nutritionDisplay.id = 'weeklyNutrition';
    nutritionDisplay.className = 'weekly-nutrition';
    const calendarBtn = document.getElementById('calendarBtn');
    calendarBtn.parentNode.insertBefore(nutritionDisplay, calendarBtn);
    return nutritionDisplay;
}

async function loadMealPlanForWeek() {
    try {
        const response = await fetch(
            `/api/DishList/${localStorage.getItem(
                'user_id'
            )}?week=${encodeURIComponent(formatWeekRange(selectedWeek))}`
        );
        const data = await response.json();

        document.querySelectorAll('.meal-products').forEach((slot) => {
            slot.innerHTML = '';
        });

        if (data.mealPlan && data.mealPlan.length > 0) {
            data.mealPlan.forEach((meal) => {
                const mealSlot = document.querySelector(
                    `[data-day="${meal.day_week}"] [data-meal="${meal.meal}"] .meal-products`
                );
                if (mealSlot) {
                    const dishElement = document.createElement('div');
                    dishElement.className = 'meal-dish';
                    dishElement.textContent = meal.name;
                    mealSlot.appendChild(dishElement);
                }
            });
        }

        updateWeeklyNutrition(
            data.weeklyTotals || { calories: 0, protein: 0, fat: 0, carbs: 0 }
        );
    } catch (error) {
        console.error('Error loading meal plan:', error);
    }
}

function updateWeeklyNutrition(weeklyTotals) {
    const nutritionDisplay =
        document.getElementById('weeklyNutrition') ||
        createWeeklyNutritionDisplay();
    nutritionDisplay.innerHTML = `
        <div class="weekly-nutrition-item">
            <span class="nutrition-label">Калории:</span>
            <span class="nutrition-value">${weeklyTotals.calories}</span>
        </div>
        <div class="weekly-nutrition-item">
            <span class="nutrition-label">Белки:</span>
            <span class="nutrition-value">${weeklyTotals.protein}г</span>
        </div>
        <div class="weekly-nutrition-item">
            <span class="nutrition-label">Жиры:</span>
            <span class="nutrition-value">${weeklyTotals.fat}г</span>
        </div>
        <div class="weekly-nutrition-item">
            <span class="nutrition-label">Углеводы:</span>
            <span class="nutrition-value">${weeklyTotals.carbs}г</span>
        </div>
    `;
}

function createWeeklyNutritionDisplay() {
    const nutritionDisplay = document.createElement('div');
    nutritionDisplay.id = 'weeklyNutrition';
    nutritionDisplay.className = 'weekly-nutrition';
    const calendarBtn = document.getElementById('calendarBtn');
    calendarBtn.parentNode.insertBefore(nutritionDisplay, calendarBtn);
    return nutritionDisplay;
}

async function loadMealPlanForWeek() {
    try {
        const response = await fetch(
            `/api/DishList/${localStorage.getItem(
                'user_id'
            )}?week=${encodeURIComponent(formatWeekRange(selectedWeek))}`
        );
        const data = await response.json();

        document.querySelectorAll('.meal-products').forEach((slot) => {
            slot.innerHTML = '';
        });

        if (data.mealPlan && data.mealPlan.length > 0) {
            data.mealPlan.forEach((meal) => {
                const mealSlot = document.querySelector(
                    `[data-day="${meal.day_week}"] [data-meal="${meal.meal}"] .meal-products`
                );
                if (mealSlot) {
                    const dishElement = document.createElement('div');
                    dishElement.className = 'meal-dish';
                    dishElement.textContent = meal.name;
                    mealSlot.appendChild(dishElement);
                }
            });
        }

        updateWeeklyNutrition(
            data.weeklyTotals || { calories: 0, protein: 0, fat: 0, carbs: 0 }
        );
    } catch (error) {
        console.error('Error loading meal plan:', error);
    }
}

function initWeekSelector() {
    const calendarBtn = document.getElementById('calendarBtn');
    const weekSelector = document.getElementById('weekSelector');
    const currentWeekSpan = document.getElementById('currentWeek');
    const weekList = document.getElementById('weekList');

    if (!calendarBtn || !weekSelector || !currentWeekSpan || !weekList) return;

    // Remove existing event listeners
    calendarBtn.replaceWith(calendarBtn.cloneNode(true));
    const newCalendarBtn = document.getElementById('calendarBtn');

    function updateCurrentWeekDisplay() {
        currentWeekSpan.textContent = formatWeekRange(selectedWeek);
    }

    function populateWeekOptions() {
        const weeks = [];
        const currentWeek = getCurrentWeek();

        for (let i = 0; i <= 4; i++) {
            const weekStart = new Date(currentWeek);
            weekStart.setDate(currentWeek.getDate() + i * 7);
            weeks.push({ startDate: weekStart, isCurrent: i === 0 });
        }

        weekList.innerHTML = '';
        weeks.forEach((week) => {
            const option = document.createElement('div');
            option.className = `week-option ${week.isCurrent ? 'current' : ''}`;
            option.innerHTML = `
                <span class="week-dates">${formatWeekRange(
                    week.startDate
                )}</span>
                <span class="week-label">${
                    week.isCurrent ? 'Текущая неделя' : ''
                }</span>
            `;
            option.addEventListener('click', async () => {
                selectedWeek = week.startDate;
                updateCurrentWeekDisplay();
                weekSelector.style.display = 'none';
                await loadMealPlanForWeek();
            });
            weekList.appendChild(option);
        });
    }

    newCalendarBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        populateWeekOptions();
        weekSelector.style.display =
            weekSelector.style.display == 'block' ? 'none' : 'block';
    });

    document.addEventListener('click', (e) => {
        if (!weekSelector.contains(e.target) && e.target !== newCalendarBtn) {
            weekSelector.style.display = 'none';
        }
    });

    updateCurrentWeekDisplay();
}

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
    const popup_space = document.getElementById('popup-space');
    const popup_text = document.getElementById('popup-text');
    const popup_title = document.getElementById('popup_title');
    const popup_Btn = document.getElementById('popup-closeBtn');
    const URL = ''; // относительные адреса — работает на любом порту/хосте
    const profilePage = document.getElementById('profilePage');
    const loginBtn = document.getElementById('loginBtn');
    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    const registerBtn = document.getElementById('registerBtn');
    const loginFormContainer = document.getElementById('loginFormContainer');
    const profileUsername = document.getElementById('profileUsername');
    const profileEmail = document.getElementById('profileEmail');
    const logoutBtn = document.getElementById('logoutBtn');
    const productsPage = document.getElementById('productsPage');
    const searchBtn = document.getElementById('searchBtn');
    const productSearchSpace = document.getElementById('productSearch');
    const historyContainer = document.getElementById('historyProducts');
    const navProfile = document.getElementById('navProfile');
    const navProducts = document.getElementById('navProducts');
    const navFavorites = document.getElementById('navFavorites');
    const navDiet = document.getElementById('navDiet');
    const navActivity = document.getElementById('navActivity');
    const navLogout = document.getElementById('navLogout');
    const mainNavbar = document.getElementById('mainNavbar');
    const productStatusMessage = document.getElementById(
        'productStatusMessage'
    );
    const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
    const productModal = document.getElementById('productModal');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const modalProductName = document.getElementById('modalProductName');
    const modalProductCategory = document.getElementById(
        'modalProductCategory'
    );
    const modalProtein = document.getElementById('modalProtein');
    const modalFat = document.getElementById('modalFat');
    const modalCarbs = document.getElementById('modalCarbs');
    const modalCalories = document.getElementById('modalCalories');
    const modalCaloriesHighlight = document.getElementById(
        'modalCaloriesHighlight'
    );
    const favoriteBtn = document.getElementById('favoriteBtn');
    const favoritesGrid = document.getElementById('favoritesGrid');
    const emptyFavorites = document.getElementById('emptyFavorites');

    const PasswordChangeBtn = document.getElementById('PasswordChangeBtn');
    const popup_closeBtn = document.getElementById('popup-closeBtn');
    const switchBtnSpace = document.getElementById('switchBtnSpace');
    const list_btn = document.querySelector('.list-btn');
    const grid_btn = document.querySelector('.grid-btn');
    function setActiveNav(page) {
        navProfile.classList.remove('active');
        navProducts.classList.remove('active');
        navFavorites.classList.remove('active');
        navDiet.classList.remove('active');
        navActivity.classList.remove('active');
        if (page === 'profile') {
            navProfile.classList.add('active');
            switchBtnSpace.style.display = 'none';
            list_btn.classList.remove('active');
            grid_btn.classList.add('active');
        }
        if (page === 'products') {
            navProducts.classList.add('active');
            switchBtnSpace.style.display = 'none';
            list_btn.classList.remove('active');
            grid_btn.classList.add('active');
        }
        if (page === 'favorites') {
            navFavorites.classList.add('active');
            switchBtnSpace.style.display = 'block';
        }
        if (page === 'diet') {
            navDiet.classList.add('active');
            switchBtnSpace.style.display = 'none';
        }
        if (page === 'activity') {
            navActivity.classList.add('active');
            switchBtnSpace.style.display = 'none';
        }
    }
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
            document.body.classList.add('logged-in');
            document.getElementById('authPage').style.display = 'none';
            document.getElementById('mainNavbar').style.display = 'flex';
            profilePage.style.display = 'block';
            profileUsername.textContent = data.user.name;
            profileEmail.textContent = data.user.email;
            localStorage.setItem('user_id', data.user.id);
            await loadProductCount();
        }
    }
    // «Продуктов найдено» — общее число найденных продуктов. Раньше бралась
    // длина истории, которая ограничена 6 записями (и счётчик застревал)
    async function loadProductCount() {
        try {
            const response = await fetch(`${URL}/api/activity`);
            if (!response.ok) return;
            const data = await response.json();
            document.getElementById('profileProductCount').textContent =
                data.stats?.totalSearches || 0;
        } catch (error) {
            console.error(error);
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
        // Требования к паролю — такие же, как на сервере и при сбросе пароля
        const passwordErrors = [];
        if (password.value.length < 8)
            passwordErrors.push('Пароль должен быть не короче 8 символов');
        if (!/\d/.test(password.value))
            passwordErrors.push('Пароль должен содержать цифру');
        if (!/[!@#$%^&*]/.test(password.value))
            passwordErrors.push(
                'Пароль должен содержать специальный символ (!@#$%^&*)'
            );
        if (passwordErrors.length) {
            alert(passwordErrors.join('\n'));
            return;
        }
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
                    popup_space.style.display = 'block';
                    popup_title.textContent = 'Регистрация';
                    popup_text.textContent =
                        'Письмо с подтверждением отправлено на почту';
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
                popup_space.style.display = 'block';
                localStorage.setItem('user_id', data.id);
                await loadProductCount();
                // «О себе» грузится при открытии страницы, когда пользователь
                // ещё не вошёл — подгружаем после входа
                if (typeof loadAboutInfo === 'function') loadAboutInfo();
                popup_title.textContent = 'Вход в аккаунт';
                popup_text.textContent = 'Вы успешно вошли в аккаунт';
                setTimeout(() => {
                    document.body.classList.add('logged-in');
                    document.getElementById('authPage').style.display = 'none';
                    document.getElementById('mainNavbar').style.display =
                        'flex';
                    profilePage.style.display = 'block';
                    profileUsername.textContent = data.name;
                    profileEmail.textContent = data.email;
                }, 2000);
            } else {
                popup_space.style.display = 'block';
                popup_title.textContent = data.status || 'Ошибка';
                // Ошибки валидации (пустые поля) приходят в data.errors —
                // раньше в окне показывалось «undefined»
                popup_text.textContent = data.errors
                    ? data.errors.map((err) => err.msg).join('\n')
                    : data.message;
            }
        } catch (error) {
            console.error('Ошибка', error);
        }
    });
    navProfile.addEventListener('click', async () => {
        document.getElementById('dietPage').style.display = 'none';
        document.getElementById('activityPage').style.display = 'none';
        profilePage.style.display = 'block';
        productsPage.style.display = 'none';
        document.getElementById('favoritesPage').style.display = 'none';
        setActiveNav('profile');

        await loadProductCount();
    });
    function createHistoryCard(product) {
        const productCard = document.createElement('div');
        productCard.className = 'history-product-card';
        productCard.innerHTML = `
                <h3>${escapeHtml(product.name)}</h3>
                <span class="category">${escapeHtml(product.category)}</span>
                <div class="nutrition-facts">
                    <div class="nutrition-item1">
                        <span class="label">Белки</span>
                        <span class="value">${product.protein}g</span>
                    </div>
                    <div class="nutrition-item1">
                        <span class="label">Жиры</span>
                        <span class="value">${product.fat}g</span>
                    </div>
                    <div class="nutrition-item1">
                        <span class="label">Углеводы</span>
                        <span class="value">${product.carbs}g</span>
                    </div>
                    <div class="nutrition-item1">
                        <span class="label">На 100г</span>
                        <span class="value">${product.calories} ккал</span>
                    </div>
                </div>
                <div class="calories-badge">${product.calories} калорий</div>
                <button class="history-favorite-btn" onclick="addToFavorites(${jsArg(product.name)})" title="Добавить в избранное">
                    <i class="fa fa-star"></i>
                </button>
            `;
        return productCard;
    }
    navProducts.addEventListener('click', async () => {
        profilePage.style.display = 'none';
        document.getElementById('dietPage').style.display = 'none';
        document.getElementById('activityPage').style.display = 'none';
        productsPage.style.display = 'block';
        document.getElementById('favoritesPage').style.display = 'none';
        setActiveNav('products');
        const response = await fetch(`${URL}/api/loadHistory`, {
            method: 'GET',
        });
        if (!response.ok) return;
        const data = await response.json();
        historyContainer.innerHTML = '';

        data.forEach((product) => {
            historyContainer.appendChild(createHistoryCard(product));
        });
    });
    navLogout.addEventListener('click', () => {
        logoutBtn.click();
    });
    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        popup_space.style.display = 'block';
        popup_title.textContent = 'Выход из аккаунта';
        popup_text.textContent = 'Вы успешно вышли из аккаунта';
        popup_Btn.style.display = 'none';
        setTimeout(async () => {
            await fetch(`${URL}/user/logout`, {
                method: 'POST',
                credentials: 'include',
            });
            location.reload();
        }, 2500);
    });
    function showProductModal(productData) {
        modalProductName.textContent = productData.name;
        modalProductCategory.textContent = productData.category;
        modalProtein.textContent = `${productData.protein}g`;
        modalFat.textContent = `${productData.fat}g`;
        modalCarbs.textContent = `${productData.carbs}g`;
        modalCalories.textContent = `${productData.calories} ккал`;
        modalCaloriesHighlight.textContent = productData.calories;

        productModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
    function hideProductModal() {
        productModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    modalCloseBtn.addEventListener('click', hideProductModal);

    productModal.addEventListener('click', (e) => {
        if (e.target === productModal) {
            hideProductModal();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && productModal.style.display === 'flex') {
            hideProductModal();
        }
        if (e.key === 'Escape' && dishModal.style.display === 'flex') {
            closeDishModal();
        }
        if (
            e.key === 'Escape' &&
            productSelectionModal.style.display === 'flex'
        ) {
            productSelectionModal.style.display = 'none';
        }
    });

    searchBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        productStatusMessage.textContent = '';
        productStatusMessage.className = 'product-status-message';
        const query = productSearchSpace.value.trim();
        if (!query) {
            productStatusMessage.textContent = 'Введите название продукта';
            productStatusMessage.className = 'product-status-message error';
            return;
        }
        document.getElementById('searchLoading').style.display = 'flex';
        let text = query;
        try {
            if (/^[а-яёА-ЯЁ\s]+$/.test(query)) {
                const responseTranslate = await fetch(
                    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
                        query
                    )}&langpair=ru|en&de=azdima45.azer@email.com`
                );
                let Translate = await responseTranslate.json();
                text = Translate.responseData.translatedText || query;
            }
        } catch (error) {
            console.log(error);
        }
        const product = { product: text };
        try {
            const response = await fetch(`${URL}/api/search`, {
                method: 'POST',
                body: JSON.stringify(product),
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            document.getElementById('searchLoading').style.display = 'none';
            if (!response.ok) {
                throw new Error(data.error || 'Ошибка поиска');
            }
            if (!data.alreadyExsist && data.name) {
                showProductModal(data);
                const productCard = createHistoryCard(data);
                productCard.style.animation = 'fadeInUp 0.5s';
                // История отсортирована от новых к старым и хранит 6 записей
                historyContainer.prepend(productCard);
                while (historyContainer.children.length > 6) {
                    historyContainer.lastElementChild.remove();
                }

                productStatusMessage.textContent = 'Продукт найден!';
                productStatusMessage.className =
                    'product-status-message success';
            } else if (data.alreadyExsist) {
                // Продукт уже искали — всё равно показываем его данные
                if (data.name) showProductModal(data);
                productStatusMessage.textContent =
                    'Вы уже добавили этот продукт';
                productStatusMessage.className = 'product-status-message';
            } else {
                productStatusMessage.textContent = 'Ничего не найдено';
                productStatusMessage.className = 'product-status-message error';
            }
        } catch (error) {
            document.getElementById('searchLoading').style.display = 'none';
            productStatusMessage.textContent = 'Ошибка поиска';
            productStatusMessage.className = 'product-status-message error';
            console.error(error);
        }
    });
    favoriteBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const product = {
            name: modalProductName.textContent,
        };
        try {
            const response = await fetch(`${URL}/api/favourite`, {
                method: 'POST',
                body: JSON.stringify(product),
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            if (data.answer.includes('уже')) {
                popup_title.textContent = 'Произошла ошибка';
            } else {
                popup_title.textContent =
                    'Продукт успешно добавлен в избранное';
            }
            popup_space.style.display = 'block';
            popup_text.textContent = data.answer;
        } catch (error) {
            console.error(error);
        }
    });
    navFavorites.addEventListener('click', async (e) => {
        e.preventDefault();
        switchBtnSpace.style.display = 'block';
        const response = await fetch(`${URL}/api/loadFavourite`);
        let products = await response.json();
        products = products.products;
        localStorage.setItem('products', JSON.stringify(products));
        profilePage.style.display = 'none';
        productsPage.style.display = 'none';
        document.getElementById('dietPage').style.display = 'none';
        document.getElementById('activityPage').style.display = 'none';
        document.getElementById('favoritesPage').style.display = 'block';
        setActiveNav('favorites');

        favoritesGrid.innerHTML = '';

        if (products.length === 0) {
            emptyFavorites.style.display = 'block';
            favoritesGrid.style.display = 'none';
        } else {
            emptyFavorites.style.display = 'none';
            favoritesGrid.style.display = 'grid';

            products.forEach((product) => {
                const favoriteCard = document.createElement('div');
                favoriteCard.className = 'favorite-product-card';
                favoriteCard.innerHTML = `
                    <h3>${escapeHtml(product.name)}</h3>
                    <span class="category">${product.category}</span>
                    <div class="favorite-nutrition-facts">
                        <div class="favorite-nutrition-item">
                            <span class="label">Белки</span>
                            <span class="value">${product.protein}g</span>
                        </div>
                        <div class="favorite-nutrition-item">
                            <span class="label">Жиры</span>
                            <span class="value">${product.fat}g</span>
                        </div>
                        <div class="favorite-nutrition-item">
                            <span class="label">Углеводы</span>
                            <span class="value">${product.carbs}g</span>
                        </div>
                        <div class="favorite-nutrition-item">
                            <span class="label">На 100 грамм</span>
                            <span class="value">${product.calories} ккал</span>
                        </div>
                    </div>
                    <div class="favorite-calories-badge">${product.calories} калорий</div>
                    <div class="favorite-actions">
                        <button class="remove-favorite-btn" onclick="removeFromFavorites(${jsArg(product.name)})">
                            Удалить из избранного
                        </button>
                    </div>
                `;
                favoritesGrid.appendChild(favoriteCard);
            });
        }
    });
    PasswordChangeBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const response = await fetch(`${URL}/user/send-reset-email`, {
            method: 'POST',
            body: JSON.stringify({}),
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const data = await response.json().catch(() => ({}));
        popup_space.style.display = 'block';
        popup_title.textContent = response.ok
            ? 'Письмо отправлено'
            : 'Произошла ошибка';
        popup_text.textContent =
            data.message ||
            (response.ok ? 'Письмо отправлено' : 'Не удалось отправить письмо');
    });
    popup_closeBtn.addEventListener('click', async (e) => {
        const popup_space = document.getElementById('popup-space');
        popup_space.style.display = 'none';
    });
    list_btn.addEventListener('click', async (e) => {
        e.preventDefault();
        let products = localStorage.getItem('products');
        products = await JSON.parse(products);
        grid_btn.classList.remove('active');
        list_btn.classList.add('active');
        favoritesGrid.innerHTML = '';
        if (products.length === 0) {
            emptyFavorites.style.display = 'block';
            favoritesGrid.style.display = 'none';
        } else {
            emptyFavorites.style.display = 'none';
            favoritesGrid.style.display = 'block';
            const listView = document.createElement('div');
            listView.className = 'favorites-list-view';

            products.forEach((product) => {
                const card = document.createElement('div');
                card.className = 'food-card-list';
                card.innerHTML = `
                <div class="food-card-list-header">
                    <h3>${escapeHtml(product.name)}</h3>
                    ${
                        product.category
                            ? `<span class="food-category">${product.category}</span>`
                            : ''
                    }
                </div>
                <div class="food-card-list-content">
                    <div class="nutrition-info">
                        <div class="nutrition-item">
                            <span class="nutrition-label">Калории</span>
                            <span class="nutrition-value">${
                                product.calories
                            }</span>
                        </div>
                        <div class="nutrition-item">
                            <span class="nutrition-label">Белки</span>
                            <span class="nutrition-value">${
                                product.protein
                            }g</span>
                        </div>
                        <div class="nutrition-item">
                            <span class="nutrition-label">Жиры</span>
                            <span class="nutrition-value">${product.fat}g</span>
                        </div>
                        <div class="nutrition-item">
                            <span class="nutrition-label">Углеводы</span>
                            <span class="nutrition-value">${
                                product.carbs
                            }g</span>
                        </div>
                    </div>
                </div>
                <div class="food-card-list-footer">
                    <button class="remove-btn-list" onclick="removeFromFavorites(${jsArg(product.name)})">
                        <i class="fas fa-trash-alt"></i> Удалить
                    </button>
                </div>
            `;
                listView.appendChild(card);
            });
            favoritesGrid.appendChild(listView);
        }
    });
    grid_btn.addEventListener('click', async (e) => {
        e.preventDefault();
        let products = localStorage.getItem('products');
        products = await JSON.parse(products);
        list_btn.classList.remove('active');
        grid_btn.classList.add('active');
        favoritesGrid.innerHTML = '';

        if (products.length === 0) {
            emptyFavorites.style.display = 'block';
            favoritesGrid.style.display = 'none';
        } else {
            emptyFavorites.style.display = 'none';
            favoritesGrid.style.display = 'grid';

            products.forEach((product) => {
                const favoriteCard = document.createElement('div');
                favoriteCard.className = 'favorite-product-card';
                favoriteCard.innerHTML = `
                    <h3>${escapeHtml(product.name)}</h3>
                    <span class="category">${product.category}</span>
                    <div class="favorite-nutrition-facts">
                        <div class="favorite-nutrition-item">
                            <span class="label">Белки</span>
                            <span class="value">${product.protein}g</span>
                        </div>
                        <div class="favorite-nutrition-item">
                            <span class="label">Жиры</span>
                            <span class="value">${product.fat}g</span>
                        </div>
                        <div class="favorite-nutrition-item">
                            <span class="label">Углеводы</span>
                            <span class="value">${product.carbs}g</span>
                        </div>
                        <div class="favorite-nutrition-item">
                            <span class="label">На 100 грамм</span>
                            <span class="value">${product.calories} ккал</span>
                        </div>
                    </div>
                    <div class="favorite-calories-badge">${product.calories} калорий</div>
                    <div class="favorite-actions">
                        <button class="remove-favorite-btn" onclick="removeFromFavorites(${jsArg(product.name)})">
                            Удалить из избранного
                        </button>
                    </div>
                `;
                favoritesGrid.appendChild(favoriteCard);
            });
        }
    });
    navDiet.addEventListener('click', async () => {
        profilePage.style.display = 'none';
        productsPage.style.display = 'none';
        document.getElementById('favoritesPage').style.display = 'none';
        document.getElementById('activityPage').style.display = 'none';
        document.getElementById('dietPage').style.display = 'block';
        setActiveNav('diet');

        initWeekSelector();
        initializeDragMeals();
        try {
            const response = await fetch(
                `${URL}/api/DishList/${localStorage.getItem(
                    'user_id'
                )}?week=${encodeURIComponent(formatWeekRange(selectedWeek))}`
            );
            const data = await response.json();

            const dishesGrid = document.getElementById('dishesGrid');
            dishesGrid.innerHTML = '';
            document.querySelectorAll('.meal-products').forEach((slot) => {
                slot.innerHTML = '';
            });
            if (data.dishes && data.dishes.length > 0) {
                data.dishes.forEach((dish) => {
                    // Раньше считалось через replace(',') — заменялась только
                    // первая запятая, и при 3+ продуктах всегда выходило «2»
                    const productsList = dish.productsList || [];
                    const productsCount = productsList.length;
                    const dishCard = document.createElement('div');
                    dishCard.className = 'dish-card';
                    dishCard.innerHTML = `
                        <button class="dish-delete-btn" onclick="event.stopPropagation(); deleteDish(${jsArg(dish.name)})">×</button>
                        <h4>${escapeHtml(dish.name)}</h4>
                        <div class="dish-products-count">${productsCount} продуктов</div>
                    `;
                    dishCard.addEventListener('click', () => {
                        const dragOverlay =
                            document.getElementById('dragOverlay');
                        const dishComposition =
                            document.getElementById('dishComposition');
                        const selectedDishName =
                            document.getElementById('selectedDishName');
                        const compositionProducts = document.getElementById(
                            'compositionProducts'
                        );
                        dragOverlay.style.display = 'flex';
                        dragOverlay.dataset.selectedDish = dish.name;
                        selectedDishName.textContent = dish.name;
                        compositionProducts.innerHTML = '';

                        {
                            const products = productsList;
                            document.getElementById('dishProtein').textContent =
                                dish.protein + 'г';
                            document.getElementById('dishFat').textContent =
                                dish.fat + 'г';
                            document.getElementById('dishCarbs').textContent =
                                dish.carbs + 'г';
                            document.getElementById(
                                'dishCalories'
                            ).textContent = dish.calories + ' ккал';
                            products.forEach((product) => {
                                const productElement =
                                    document.createElement('div');
                                productElement.className =
                                    'composition-product';
                                productElement.textContent = product.trim();
                                compositionProducts.appendChild(productElement);
                            });
                        }

                        dishComposition.style.display = 'block';
                    });
                    dishesGrid.appendChild(dishCard);
                });
            }

            // Populate meal slots from history_dishes
            if (data.mealPlan && data.mealPlan.length > 0) {
                data.mealPlan.forEach((meal) => {
                    const mealSlot = document.querySelector(
                        `[data-day="${meal.day_week}"] [data-meal="${meal.meal}"] .meal-products`
                    );
                    if (mealSlot) {
                        const dishElement = document.createElement('div');
                        dishElement.className = 'meal-dish';
                        dishElement.textContent = meal.name;
                        mealSlot.appendChild(dishElement);
                    }
                });
            }

            updateWeeklyNutrition(
                data.weeklyTotals || {
                    calories: 0,
                    protein: 0,
                    fat: 0,
                    carbs: 0,
                }
            );
        } catch (error) {
            console.error('Ошибка загрузки', error);
        }
    });

    navActivity.addEventListener('click', async () => {
        profilePage.style.display = 'none';
        productsPage.style.display = 'none';
        document.getElementById('favoritesPage').style.display = 'none';
        document.getElementById('dietPage').style.display = 'none';
        document.getElementById('activityPage').style.display = 'block';
        setActiveNav('activity');

        // Load activity charts
        await loadActivityCharts();
    });

    let searchChart = null;
    let dishChart = null;

    async function loadActivityCharts() {
        try {
            const response = await fetch(`${URL}/api/activity`, {
                method: 'GET',
                credentials: 'include',
            });
            const data = await response.json();

            createSearchChart(data.searches || []);
            createDishChart(data.dishes || []);
            updateStats(data.stats || {});
            updateAchievements(data.stats || {});
        } catch (error) {
            console.error('Error loading activity data:', error);
        }
    }

    function createSearchChart(searchData) {
        const ctx = document.getElementById('searchChart');
        if (!ctx) return;
        if (searchChart) {
            searchChart.destroy();
        }
        const labels =
            searchData.length > 0
                ? searchData.map((item) =>
                      String(item.date).slice(0, 10).split('-').reverse().join('.')
                  )
                : ['Нет данных'];
        const counts =
            searchData.length > 0
                ? searchData.map((item) => parseInt(item.count))
                : [0];

        searchChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels.reverse(),
                datasets: [
                    {
                        label: 'Продукты найдены',
                        data: counts.reverse(),
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        tension: 0.4,
                    },
                ],
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                        },
                    },
                },
            },
        });
    }
    function createDishChart(dishData) {
        const ctx = document.getElementById('dishChart');
        if (!ctx) return;
        if (dishChart) {
            dishChart.destroy();
        }

        const labels =
            dishData.length > 0
                ? dishData.map((item) =>
                      String(item.date).slice(0, 10).split('-').reverse().join('.')
                  )
                : ['Нет данных'];
        const counts =
            dishData.length > 0
                ? dishData.map((item) => parseInt(item.count))
                : [0];

        dishChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels.reverse(),
                datasets: [
                    {
                        label: 'Блюда созданы',
                        data: counts.reverse(),
                        backgroundColor: '#764ba2',
                        borderColor: '#764ba2',
                        borderWidth: 1,
                    },
                ],
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                        },
                    },
                },
            },
        });
    }

    function updateStats(stats) {
        document.getElementById('totalSearches').textContent =
            stats.totalSearches || 0;
        document.getElementById('totalDishes').textContent =
            stats.totalDishes || 0;
        document.getElementById('totalFavorites').textContent =
            stats.totalFavorites || 0;
    }

    function updateAchievements(stats) {
        const achievements = [
            {
                icon: '🔍',
                title: 'Первооткрыватель',
                desc: 'Найти первый продукт',
                unlocked: stats.totalSearches >= 1,
            },
            {
                icon: '🍽️',
                title: 'Шеф-повар',
                desc: 'Создать первое блюдо',
                unlocked: stats.totalDishes >= 1,
            },
            {
                icon: '❤️',
                title: 'Коллекционер',
                desc: 'Добавить 5 продуктов в избранное',
                unlocked: stats.totalFavorites >= 5,
            },
            {
                icon: '🏆',
                title: 'Активист',
                desc: 'Найти 10 продуктов',
                unlocked: stats.totalSearches >= 10,
            },
            {
                icon: '👨🍳',
                title: 'Мастер кухни',
                desc: 'Создать 5 блюд',
                unlocked: stats.totalDishes >= 5,
            },
        ];

        const achievementsGrid = document.getElementById('achievementsGrid');
        achievementsGrid.innerHTML = '';

        achievements.forEach((achievement) => {
            const badge = document.createElement('div');
            badge.className = `achievement-badge ${
                achievement.unlocked ? 'unlocked' : ''
            }`;
            badge.innerHTML = `
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-title">${achievement.title}</div>
                <div class="achievement-desc">${achievement.desc}</div>
            `;
            achievementsGrid.appendChild(badge);
        });
    }

    const createDishBtn = document.getElementById('createDishBtn');
    const dishModal = document.getElementById('dishModal');
    const cancelDishBtn = document.getElementById('cancelDishBtn');
    const saveDishBtn = document.getElementById('saveDishBtn');
    const dishNameInput = document.getElementById('dishName');
    const productSelectionModal = document.getElementById(
        'productSelectionModal'
    );
    const productSelectionClose = document.getElementById(
        'productSelectionClose'
    );
    const productSelectionList = document.getElementById(
        'productSelectionList'
    );

    createDishBtn.addEventListener('click', () => {
        dishModal.style.display = 'flex';
        dishNameInput.focus();
    });

    // Закрытие окна создания блюда любым способом очищает выбранные
    // продукты (раньше они оставались и попадали в следующее блюдо)
    function closeDishModal() {
        dishModal.style.display = 'none';
        dishNameInput.value = '';
        const dishProductsList = document.getElementById('dishProductsList');
        const productItems = dishProductsList.querySelectorAll('.product-item');
        productItems.forEach((item) => item.remove());
    }

    cancelDishBtn.addEventListener('click', closeDishModal);

    dishModal.addEventListener('click', (e) => {
        if (e.target === dishModal) {
            closeDishModal();
        }
    });

    document.addEventListener('click', async (e) => {
        if (e.target.closest('.add-product-btn')) {
            e.preventDefault();

            const response = await fetch(`${URL}/api/loadFavourite`);
            let products = await response.json();
            localStorage.setItem('products_ids', products.products_ids);
            products = products.products;
            productSelectionList.innerHTML = '';

            if (products.length === 0) {
                productSelectionList.innerHTML =
                    '<p style="text-align: center; color: #666; padding: 2rem;">Нет избранных продуктов</p>';
            } else {
                products.forEach((product) => {
                    const productCard = document.createElement('div');
                    productCard.className = 'selectable-product-card';
                    productCard.innerHTML = `
                        <input type="checkbox" class="selectable-product-checkbox">
                        <div class="selectable-product-info">
                            <div class="selectable-product-name">${escapeHtml(product.name)}</div>
                            <div class="selectable-product-nutrition">
                                <span>${product.calories} ккал</span>
                                <span>Б ${product.protein}г</span>
                                <span>Ж ${product.fat}г</span>
                                <span>У ${product.carbs}г</span>
                            </div>
                        </div>
                    `;

                    productCard.addEventListener('click', (e) => {
                        if (e.target.type !== 'checkbox') {
                            const checkbox = productCard.querySelector(
                                '.selectable-product-checkbox'
                            );
                            checkbox.checked = !checkbox.checked;
                        }
                        productCard.classList.toggle(
                            'selected',
                            productCard.querySelector(
                                '.selectable-product-checkbox'
                            ).checked
                        );
                    });

                    productSelectionList.appendChild(productCard);
                });
            }

            productSelectionModal.style.display = 'flex';
        }
    });

    productSelectionClose.addEventListener('click', () => {
        productSelectionModal.style.display = 'none';
    });

    productSelectionModal.addEventListener('click', (e) => {
        if (e.target === productSelectionModal) {
            productSelectionModal.style.display = 'none';
        }
    });

    const dishModalClose = document.getElementById('dishModalClose');
    const addSelectedProductsBtn = document.getElementById(
        'addSelectedProductsBtn'
    );

    dishModalClose.addEventListener('click', closeDishModal);

    addSelectedProductsBtn.addEventListener('click', () => {
        const selectedProducts = document.querySelectorAll(
            '.selectable-product-checkbox:checked'
        );
        const dishProductsList = document.getElementById('dishProductsList');

        selectedProducts.forEach((checkbox) => {
            const productCard = checkbox.closest('.selectable-product-card');
            const productName = productCard.querySelector(
                '.selectable-product-name'
            ).textContent;

            const productItem = document.createElement('div');
            productItem.className = 'product-item';
            productItem.innerHTML = `
                <div class="product-image-placeholder">
                    <span>🍽️</span>
                </div>
                <div class="product-name">${escapeHtml(productName)}</div>
            `;

            dishProductsList.insertBefore(
                productItem,
                dishProductsList.querySelector('.add-product-btn')
            );
        });

        productSelectionModal.style.display = 'none';
    });

    saveDishBtn.addEventListener('click', async () => {
        const dishName = dishNameInput.value.trim();
        if (dishName) {
            const dishProductsList =
                document.getElementById('dishProductsList');
            const productItems =
                dishProductsList.querySelectorAll('.product-item');
            const productsCount = productItems.length;
            const dishesGrid = document.getElementById('dishesGrid');
            const productsNames = [];
            productItems.forEach((item) => {
                productsNames.push(
                    item.querySelector('.product-name').textContent
                );
            });

            const createResponse = await fetch(`${URL}/api/createDish`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: dishName,
                    products: productsNames,
                }),
            });
            // Раньше ответ не проверялся и «Блюдо успешно создано!»
            // показывалось даже при ошибке
            if (!createResponse.ok) {
                const err = await createResponse.json().catch(() => ({}));
                popup_space.style.display = 'block';
                popup_title.textContent = 'Произошла ошибка';
                popup_text.textContent =
                    err.message || 'Не удалось создать блюдо';
                return;
            }

            const response = await fetch(
                `${URL}/api/DishList/${localStorage.getItem('user_id')}`
            );
            const dishesData = await response.json();
            const newDish = dishesData.dishes.find(
                (dish) => dish.name === dishName
            );

            popup_space.style.display = 'block';
            popup_text.textContent = 'Блюдо успешно создано!';
            popup_title.textContent = 'Успех';

            const dishCard = document.createElement('div');
            dishCard.className = 'dish-card';
            dishCard.innerHTML = `
                <button class="dish-delete-btn" onclick="event.stopPropagation(); deleteDish(${jsArg(dishName)})">×</button>
                <h4>${escapeHtml(dishName)}</h4>
                <div class="dish-products-count">${productsCount} продуктов</div>
            `;

            dishCard.addEventListener('click', () => {
                const dragOverlay = document.getElementById('dragOverlay');
                const dishComposition =
                    document.getElementById('dishComposition');
                const selectedDishName =
                    document.getElementById('selectedDishName');
                const compositionProducts = document.getElementById(
                    'compositionProducts'
                );

                dragOverlay.style.display = 'flex';
                dragOverlay.dataset.selectedDish = dishName;
                selectedDishName.textContent = dishName;
                compositionProducts.innerHTML = '';

                productsNames.forEach((product) => {
                    const productElement = document.createElement('div');
                    productElement.className = 'composition-product';
                    productElement.textContent = product.trim();
                    compositionProducts.appendChild(productElement);
                });
                if (newDish) {
                    document.getElementById('dishProtein').textContent =
                        newDish.protein + 'г';
                    document.getElementById('dishFat').textContent =
                        newDish.fat + 'г';
                    document.getElementById('dishCarbs').textContent =
                        newDish.carbs + 'г';
                    document.getElementById('dishCalories').textContent =
                        newDish.calories + ' ккал';
                }

                dishComposition.style.display = 'block';
            });

            dishesGrid.appendChild(dishCard);
            productItems.forEach((item) => item.remove());
            dishModal.style.display = 'none';
            dishNameInput.value = '';
        } else {
            alert('Пожалуйста, введите название блюда');
        }
    });

    forgotPasswordBtn.addEventListener('click', async () => {
        document.getElementById('forgotPasswordModal').style.display = 'flex';
    });

    document
        .getElementById('forgotModalClose')
        .addEventListener('click', () => {
            document.getElementById('forgotPasswordModal').style.display =
                'none';
        });

    document
        .getElementById('sendResetBtn')
        .addEventListener('click', async (e) => {
            e.preventDefault();
            const forgotEmail = document.getElementById('forgotEmail').value.trim();
            if (!forgotEmail) {
                alert('Введите email');
                return;
            }
            const response = await fetch(`${URL}/user/send-reset-email`, {
                method: 'POST',
                body: JSON.stringify({
                    email: forgotEmail,
                }),
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json().catch(() => ({}));
            document.getElementById('forgotPasswordModal').style.display =
                'none';
            popup_space.style.display = 'block';
            popup_title.textContent = response.ok
                ? 'Письмо отправлено'
                : 'Произошла ошибка';
            popup_text.textContent =
                data.message ||
                (response.ok
                    ? `Письмо со сменой пароля отправлено на почту ${forgotEmail}`
                    : 'Не удалось отправить письмо');
        });

    let dragMealsInitialized = false;
    function initializeDragMeals() {
        // Функция вызывается при каждом открытии вкладки «Питание». Раньше
        // каждый раз добавлялся новый обработчик, и после N открытий вкладки
        // одно нажатие добавляло блюдо в план N раз
        if (dragMealsInitialized) return;
        dragMealsInitialized = true;
        const dragOverlay = document.getElementById('dragOverlay');

        // Use event delegation instead of individual listeners
        document.addEventListener('click', async (e) => {
            if (e.target.classList.contains('drag-meal')) {
                const selectedDish = dragOverlay.dataset.selectedDish;
                if (selectedDish) {
                    const day = e.target.closest('.drag-day').dataset.day;
                    const mealType = e.target.dataset.meal;
                    const actualMealSlot = document.querySelector(
                        `[data-day="${day}"] [data-meal="${mealType}"] .meal-products`
                    );
                    const dishElement = document.createElement('div');
                    dishElement.className = 'meal-dish';
                    dishElement.textContent = selectedDish;
                    actualMealSlot.appendChild(dishElement);
                    // Закрываем выбор сразу, чтобы двойной клик не добавил
                    // блюдо дважды
                    dragOverlay.style.display = 'none';
                    document.getElementById('dishComposition').style.display =
                        'none';
                    delete dragOverlay.dataset.selectedDish;
                    const response = await fetch(`${URL}/api/createMeal`, {
                        method: 'POST',
                        body: JSON.stringify({
                            user_id: localStorage.getItem('user_id'),
                            day: day,
                            meal: mealType,
                            dish: selectedDish,
                            week: formatWeekRange(selectedWeek),
                        }),
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    });
                    if (!response.ok) {
                        dishElement.remove();
                        alert('Не удалось добавить блюдо в план питания');
                    }

                    await updateWeeklyNutritionAfterMealAdd();
                }
            }
        });
    }

    async function updateWeeklyNutritionAfterMealAdd() {
        try {
            const response = await fetch(
                `${URL}/api/DishList/${localStorage.getItem(
                    'user_id'
                )}?week=${encodeURIComponent(formatWeekRange(selectedWeek))}`
            );
            const data = await response.json();

            updateWeeklyNutrition(
                data.weeklyTotals || {
                    calories: 0,
                    protein: 0,
                    fat: 0,
                    carbs: 0,
                }
            );
        } catch (error) {
            console.error('Error updating weekly nutrition:', error);
        }
    }

    dragOverlay.addEventListener('click', (e) => {
        if (e.target === dragOverlay) {
            dragOverlay.style.display = 'none';
            document.getElementById('dishComposition').style.display = 'none';
            delete dragOverlay.dataset.selectedDish;
        }
    });
});
