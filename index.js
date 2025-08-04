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
    const navLogout = document.getElementById('navLogout');
    const mainNavbar = document.getElementById('mainNavbar');
    const productStatusMessage = document.getElementById(
        'productStatusMessage'
    );
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
        if (page === 'favorites') navFavorites.classList.add('active');
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
            document.getElementById('authPage').style.display = 'none';
            document.getElementById('mainNavbar').style.display = 'flex';
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
                popup_title.textContent = 'Вход в аккаунт';
                popup_text.textContent = 'Вы успешно вошли в аккаунт';
                setTimeout(() => {
                    document.getElementById('authPage').style.display = 'none';
                    document.getElementById('mainNavbar').style.display =
                        'flex';
                    profilePage.style.display = 'block';
                    profileUsername.textContent = data.name;
                    profileEmail.textContent = data.email;
                }, 2000);
            } else {
                popup_space.style.display = 'block';
                popup_title.textContent = 'Подтверждение почты';
                popup_text.textContent = 'Вы не подтвердили почту';
            }
        } catch (error) {
            console.error('Ошибка', error);
        }
    });
    navProfile.addEventListener('click', () => {
        profilePage.style.display = 'block';
        productsPage.style.display = 'none';
        document.getElementById('favoritesPage').style.display = 'none';
        setActiveNav('profile');
    });
    navProducts.addEventListener('click', async () => {
        profilePage.style.display = 'none';
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
                <div class="nutrition-facts1">
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
                        <div class="nutrition-item">
                            <span class="label">Белки</span>
                            <span class="value">${data.protein}g</span>
                        </div>
                        <div class="nutrition-item">
                            <span class="label">Жиры</span>
                            <span class="value">${data.fat}g</span>
                        </div>
                        <div class="nutrition-item">
                            <span class="label">Углеводы</span>
                            <span class="value">${data.carbs}g</span>
                        </div>
                        <div class="nutrition-item">
                            <span class="label">На 100г</span>
                            <span class="value">${data.calories} ккал</span>
                        </div>
                    </div>
                    <div class="calories-badge">${data.calories} калорий</div>
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
        const products = await response.json();
        localStorage.setItem('products', JSON.stringify(products));
        console.log(products);
        profilePage.style.display = 'none';
        productsPage.style.display = 'none';
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
});
