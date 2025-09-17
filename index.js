async function removeFromFavorites(productName) {
    try {
        const response = await fetch(
            `http://localhost:5000/api/deleteFavourite`,
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
                        const favoritesCount =
                            document.getElementById('favoritesCount');
                        const currentCount = parseInt(
                            favoritesCount.textContent
                        );
                        favoritesCount.textContent = currentCount - 1;
                        let remainingCards = '';
                        let index = 0;
                        let cnt = 0;
                        for (let product of products) {
                            if (product.name == productName) {
                                index = cnt;
                            }
                            cnt++;
                        }
                        products.splice(index, 1);
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
    await fetch('http://localhost:5000/api/deleteDish', {
        method: 'DELETE',
        body: JSON.stringify({ name: dishName }),
        headers: {
            'Content-Type': 'application/json',
        },
    });

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
}

async function addToFavorites(ProductName) {
    try {
        const response = await fetch('http://localhost:5000/api/favourite', {
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
    const URL = 'http://localhost:5000';
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
    const favoritesCount = document.getElementById('favoritesCount');
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
                popup_title.textContent = data.status;
                popup_text.textContent = data.message;
            }
        } catch (error) {
            console.error('Ошибка', error);
        }
    });
    navProfile.addEventListener('click', () => {
        document.getElementById('dietPage').style.display = 'none';
        profilePage.style.display = 'block';
        productsPage.style.display = 'none';
        document.getElementById('favoritesPage').style.display = 'none';
        setActiveNav('profile');
    });
    navProducts.addEventListener('click', async () => {
        profilePage.style.display = 'none';
        document.getElementById('dietPage').style.display = 'none';
        productsPage.style.display = 'block';
        document.getElementById('favoritesPage').style.display = 'none';
        setActiveNav('products');
        const response = await fetch(`${URL}/api/loadHistory`, {
            method: 'GET',
        });
        const data = await response.json();
        historyContainer.innerHTML = '';

        data.forEach((product) => {
            const productCard = document.createElement('div');
            productCard.className = 'history-product-card';
            productCard.innerHTML = `
                <h3>${product.name}</h3>
                <span class="category">${product.category}</span>
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
                <button class="history-favorite-btn" onclick="addToFavorites('${product.name}')" title="Добавить в избранное">
                    <i class="fa fa-star"></i>
                </button>
            `;
            historyContainer.appendChild(productCard);
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
    function updateProductCount() {
        const count = document.querySelectorAll('.history-product-card').length;
        document.getElementById('profileProductCount').textContent = count;
    }
    const observer = new MutationObserver(updateProductCount);
    observer.observe(historyContainer, { childList: true });
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
            dishModal.style.display = 'none';
            dishNameInput.value = '';
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
        document.getElementById('searchLoading').style.display = 'flex';
        productStatusMessage.textContent = '';
        productStatusMessage.className = 'product-status-message';
        let text = '';
        try {
            if (/^[а-яёА-ЯЁ\s]+$/.test(productSearchSpace.value)) {
                const responseTranslate = await fetch(
                    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
                        productSearchSpace.value
                    )}&langpair=ru|en&de=azdima45.azer@email.com`
                );
                let Translate = await responseTranslate.json();
                text = Translate.responseData.translatedText;
            } else {
                text = productSearchSpace.value;
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
            if (!data.alreadyExsist && data.name) {
                showProductModal(data);
                const productCard = document.createElement('div');
                productCard.className = 'history-product-card';
                productCard.style.animation = 'fadeInUp 0.5s';
                productCard.innerHTML = `
                    <h3>${data.name}</h3>
                    <span class="category">${data.category}</span>
                    <div class="nutrition-facts">
                        <div class="nutrition-item1">
                            <span class="label">Белки</span>
                            <span class="value">${data.protein}g</span>
                        </div>
                        <div class="nutrition-item1">
                            <span class="label">Жиры</span>
                            <span class="value">${data.fat}g</span>
                        </div>
                        <div class="nutrition-item1">
                            <span class="label">Углеводы</span>
                            <span class="value">${data.carbs}g</span>
                        </div>
                        <div class="nutrition-item1">
                            <span class="label">На 100г</span>
                            <span class="value">${data.calories} ккал</span>
                        </div>
                    </div>
                    <div class="calories-badge">${data.calories} калорий</div>
                    <button class="history-favorite-btn" onclick="addToFavorites('${data.name}')" title="Добавить в избранное">
                        <i class="fa fa-star"></i>
                    </button>
                `;
                historyContainer.appendChild(productCard);

                productStatusMessage.textContent = 'Продукт найден!';
                productStatusMessage.className =
                    'product-status-message success';
            } else if (data.alreadyExsist) {
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
        document.getElementById('favoritesPage').style.display = 'block';
        setActiveNav('favorites');

        favoritesGrid.innerHTML = '';

        favoritesCount.textContent = products.length;

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
                    <h3>${product.name}</h3>
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
                        <button class="remove-favorite-btn" onclick="removeFromFavorites('${product.name}')">
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
        const popup_space = document.getElementById('popup-space');
        const popup_text = document.getElementById('popup-text');
        const popup_title = document.getElementById('popup_title');
        popup_space.style.display = 'block';
        popup_text.textContent = `Письмо со сменой пароля отправлено на почту ${profileEmail.textContent}`;
        popup_title.textContent = 'Письмо отправлено';
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
                    <h3>${product.name}</h3>
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
                    <button class="remove-btn-list" onclick="removeFromFavorites('${
                        product.name
                    }')">
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
                    <h3>${product.name}</h3>
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
                        <button class="remove-favorite-btn" onclick="removeFromFavorites('${product.name}')">
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
        document.getElementById('dietPage').style.display = 'block';
        setActiveNav('diet');
        try {
            const response = await fetch(
                `${URL}/api/DishList/${localStorage.getItem('user_id')}`
            );
            const data = await response.json();

            const dishesGrid = document.getElementById('dishesGrid');
            dishesGrid.innerHTML = '';
            document.querySelectorAll('.meal-products').forEach((slot) => {
                slot.innerHTML = '';
            });
            if (data && data.length > 0) {
                data.forEach((dish) => {
                    const productsCount =
                        dish.products.length -
                        dish.products.replace(',', '').length +
                        1;
                    const dishCard = document.createElement('div');
                    dishCard.className = 'dish-card';
                    dishCard.innerHTML = `
                        <button class="dish-delete-btn" onclick="event.stopPropagation(); deleteDish('${dish.name}')">×</button>
                        <h4>${dish.name}</h4>
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

                        if (dish.products) {
                            const products = dish.products
                                .replace('{', '')
                                .replace('}', '')
                                .replaceAll('"', '')
                                .split(',');
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
                    if (dish.day_week && dish.meal) {
                        const days = dish.day_week.split(',');
                        const meals = dish.meal.split(',');

                        days.forEach((day, index) => {
                            if (meals[index]) {
                                const dayTrimmed = day.trim();
                                const mealTrimmed = meals[index].trim();
                                const mealSlot = document.querySelector(
                                    `[data-day="${dayTrimmed}"] [data-meal="${mealTrimmed}"] .meal-products`
                                );
                                if (mealSlot) {
                                    const dishElement =
                                        document.createElement('div');
                                    dishElement.className = 'meal-dish';
                                    dishElement.textContent = dish.name;
                                    mealSlot.appendChild(dishElement);
                                }
                            }
                        });
                    }
                });
            } else {
                console.log('нет блюд');
            }
        } catch (error) {
            console.error('Ошибка загрузки', error);
        }
    });

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

    cancelDishBtn.addEventListener('click', () => {
        dishModal.style.display = 'none';
        dishNameInput.value = '';
        const dishProductsList = document.getElementById('dishProductsList');
        const productItems = dishProductsList.querySelectorAll('.product-item');
        productItems.forEach((item) => item.remove());
    });

    dishModal.addEventListener('click', (e) => {
        if (e.target === dishModal) {
            dishModal.style.display = 'none';
            dishNameInput.value = '';
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
                            <div class="selectable-product-name">${product.name}</div>
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

    dishModalClose.addEventListener('click', () => {
        dishModal.style.display = 'none';
        dishNameInput.value = '';
    });

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
                <div class="product-name">${productName}</div>
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

            await fetch(`${URL}/api/createDish`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: dishName,
                    user_id: localStorage.getItem('user_id'),
                    products: productsNames,
                }),
            });

            // Fetch updated dish data with nutrition values
            const response = await fetch(
                `${URL}/api/DishList/${localStorage.getItem('user_id')}`
            );
            const dishesData = await response.json();
            const newDish = dishesData.find((dish) => dish.name === dishName);

            popup_space.style.display = 'block';
            popup_text.textContent = 'Блюдо успешно создано!';
            popup_title.textContent = 'Успех';

            const dishCard = document.createElement('div');
            dishCard.className = 'dish-card';
            dishCard.innerHTML = `
                <button class="dish-delete-btn" onclick="event.stopPropagation(); deleteDish('${dishName}')">×</button>
                <h4>${dishName}</h4>
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

                // Display products
                productsNames.forEach((product) => {
                    const productElement = document.createElement('div');
                    productElement.className = 'composition-product';
                    productElement.textContent = product.trim();
                    compositionProducts.appendChild(productElement);
                });

                // Set actual nutrition values from server
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
            const response = await fetch(`${URL}/user/send-reset-email`, {
                method: 'POST',
                body: JSON.stringify({
                    email: document.getElementById('forgotEmail').value,
                }),
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            document.getElementById('forgotPasswordModal').style.display =
                'none';
            popup_space.style.display = 'block';
            popup_text.textContent = `Письмо со сменой пароля отправлено на почту ${
                document.getElementById('forgotEmail').value
            }`;
            popup_title.textContent = 'Письмо отправлено';
        });

    const dragMeals = document.querySelectorAll('.drag-meal');
    const dragOverlay = document.getElementById('dragOverlay');

    dragMeals.forEach((meal) => {
        meal.addEventListener('click', async () => {
            const selectedDish = dragOverlay.dataset.selectedDish;
            if (selectedDish) {
                const day = meal.closest('.drag-day').dataset.day;
                const mealType = meal.dataset.meal;
                const actualMealSlot = document.querySelector(
                    `[data-day="${day}"] [data-meal="${mealType}"] .meal-products`
                );
                const dishElement = document.createElement('div');
                dishElement.className = 'meal-dish';
                dishElement.textContent = selectedDish;
                actualMealSlot.appendChild(dishElement);
                const response = await fetch(`${URL}/api/createMeal`, {
                    method: 'POST',
                    body: JSON.stringify({
                        user_id: localStorage.getItem('user_id'),
                        day: day,
                        meal: mealType,
                        dish: selectedDish,
                    }),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                dragOverlay.style.display = 'none';
                document.getElementById('dishComposition').style.display =
                    'none';
                delete dragOverlay.dataset.selectedDish;
            }
        });
    });

    dragOverlay.addEventListener('click', (e) => {
        if (e.target === dragOverlay) {
            dragOverlay.style.display = 'none';
            document.getElementById('dishComposition').style.display = 'none';
            delete dragOverlay.dataset.selectedDish;
        }
    });
});
