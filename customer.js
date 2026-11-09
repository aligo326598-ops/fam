
"use strict";

/*
 FAM PHARMA TURKEY - CUSTOMER FRONTEND

 Giriş ve kayıt: Arayüz önizlemesi.
 Favoriler: Aynı tarayıcıda geçici kayıt.
*/

// Şifre göster / gizle
document.querySelectorAll("[data-password-toggle]")
    .forEach(button => {
        button.addEventListener("click", () => {
            const input = document.getElementById(
                button.dataset.passwordToggle
            );

            if (!input) return;

            const show = input.type === "password";
            input.type = show ? "text" : "password";
            button.textContent = show ? "Gizle" : "Göster";
        });
    });

// Giriş formu - gerçek hesap oluşturmaz.
const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", event => {
        event.preventDefault();

        document.getElementById("authMessage").textContent =
            "Giriş sistemi henüz etkin değil. " +
            "Backend bağlantısından sonra kullanılabilecek.";

        // Şifreyi saklama.
        document.getElementById("loginPassword").value = "";
    });
}

// Kayıt formu - kullanıcı bilgilerini saklamaz.
const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", event => {
        event.preventDefault();

        const password = document.getElementById(
            "registerPassword"
        ).value;

        const confirmation = document.getElementById(
            "confirmPassword"
        ).value;

        const message = document.getElementById("authMessage");

        if (password !== confirmation) {
            message.textContent = "Şifreler eşleşmiyor.";
            return;
        }

        message.textContent =
            "Kayıt arayüzü hazır. " +
            "Gerçek üyelik işlemi backend aşamasında açılacak.";

        // Hassas girişleri temizle.
        document.getElementById("registerPassword").value = "";
        document.getElementById("confirmPassword").value = "";
    });
}

// Favorilerim sayfası
const favoritesGrid = document.getElementById("favoritesGrid");

function renderFavorites() {
    if (!favoritesGrid || typeof ProductStore === "undefined") {
        return;
    }

    const favoriteIds = ProductStore.getFavorites();

    const favoriteProducts = ProductStore.all().filter(
        product => favoriteIds.includes(String(product.id))
    );

    favoritesGrid.replaceChildren();

    favoriteProducts.forEach(product => {
        const card = document.createElement("article");
        card.className = "product-card";

        const imageLink = document.createElement("a");
        imageLink.href = ProductStore.detailUrl(product.id);
        imageLink.className = "product-image";

        const image = document.createElement("img");
        image.src = ProductStore.resolveImage(product.front);
        image.alt = product.name;
        image.loading = "lazy";

        image.onerror = () => {
            image.onerror = null;
            image.src = "images/ui/product-placeholder.svg";
        };

        imageLink.appendChild(image);

        const details = document.createElement("div");
        details.className = "product-details";

        const category = document.createElement("span");
        category.className = "product-brand";
        category.textContent = product.categoryName;

        const title = document.createElement("h3");
        title.textContent = product.name;

        const price = document.createElement("p");
        price.className = "product-type";
        price.textContent = ProductStore.formatPrice(product.price);

        const detailLink = document.createElement("a");
        detailLink.className = "view-product-btn";
        detailLink.href = ProductStore.detailUrl(product.id);
        detailLink.textContent = "Ürünü İncele";

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "favorite-remove";
        remove.textContent = "♥ Favorilerden Çıkar";

        remove.addEventListener("click", () => {
            if (ProductStore.isFavorite(product.id)) {
                ProductStore.toggleFavorite(product.id);
            }

            renderFavorites();
        });

        details.append(
            category,
            title,
            price,
            detailLink,
            remove
        );

        card.append(imageLink, details);
        favoritesGrid.appendChild(card);
    });

    document.getElementById("favoritesCount").textContent =
        favoriteProducts.length + " favori ürün";

    document.getElementById("favoritesEmpty").hidden =
        favoriteProducts.length !== 0;
}

renderFavorites();
