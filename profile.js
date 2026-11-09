
"use strict";

/* ==========================================
   FAM PHARMA TURKEY - MÜŞTERİ PROFİLİ

   Demo hesap özeti:
   - Siparişler
   - Favoriler
   - Adresler
   - Sepet
   - Son sipariş
   - Varsayılan adres
========================================== */

const PROFILE_STEPS = [
    "Sipariş Alındı",
    "Hazırlanıyor",
    "Kargoda",
    "Teslim Edildi"
];

function profileElement(tag, text, className = "") {
    const element = document.createElement(tag);

    element.textContent = String(text ?? "");

    if (className) {
        element.className = className;
    }

    return element;
}

function getProfileFavorites() {
    try {
        const favorites = ProductStore.getFavorites();

        return Array.isArray(favorites)
            ? favorites
            : [];
    } catch (error) {
        console.error("Favoriler okunamadı:", error);
        return [];
    }
}

function getProfileOrders() {
    return ShoppingStore.orders();
}

function getProfileAddresses() {
    return ShoppingStore.addresses();
}

function getProfileCart() {
    return ShoppingStore.cart();
}

// ==========================================
// DASHBOARD SAYILARI
// ==========================================

function renderProfileStats() {
    const orders = getProfileOrders();
    const addresses = getProfileAddresses();
    const favorites = getProfileFavorites();
    const cart = getProfileCart();

    const cartQuantity = cart.reduce((total, item) => {
        const quantity = Number(item.quantity);

        return total + (
            Number.isSafeInteger(quantity) && quantity > 0
                ? quantity
                : 0
        );
    }, 0);

    document.getElementById("profileOrderCount")
        .textContent = orders.length;

    document.getElementById("profileAddressCount")
        .textContent = addresses.length;

    document.getElementById("profileFavoriteCount")
        .textContent = favorites.length;

    document.getElementById("profileCartCount")
        .textContent = cartQuantity;
}

// ==========================================
// SON SİPARİŞ
// ==========================================

function renderLatestOrder() {
    const container =
        document.getElementById("profileLatestOrder");

    container.replaceChildren();

    const orders = [...getProfileOrders()];

    if (orders.length === 0) {
        const empty = document.createElement("div");
        empty.className = "profile-empty";

        const message = profileElement(
            "p",
            "Henüz demo siparişiniz bulunmuyor."
        );

        const link = profileElement(
            "a",
            "Ürünleri Keşfet →",
            "profile-action-link"
        );

        link.href = "products.html";

        empty.append(message, link);
        container.appendChild(empty);
        return;
    }

    orders.sort((a, b) =>
        (b.date || "").localeCompare(a.date || "")
    );

    const order = orders[0];

    const card = document.createElement("article");
    card.className = "profile-order-card";

    const top = document.createElement("div");
    top.className = "profile-order-top";

    const titleGroup = document.createElement("div");

    const number = profileElement(
        "strong",
        order.number || "Demo Sipariş"
    );

    const formattedDate = order.date &&
        !Number.isNaN(new Date(order.date).getTime())
        ? new Date(order.date).toLocaleString("tr-TR")
        : "Tarih belirtilmedi";

    const date = profileElement(
        "small",
        formattedDate
    );

    titleGroup.append(number, date);

    const status = PROFILE_STEPS.includes(order.status)
        ? order.status
        : "Sipariş Alındı";

    const statusBadge = profileElement(
        "span",
        status,
        "profile-order-status"
    );

    top.append(titleGroup, statusBadge);

    // Sipariş aşamaları
    const progress = document.createElement("div");
    progress.className = "profile-progress";

    const currentStep = PROFILE_STEPS.indexOf(status);

    PROFILE_STEPS.forEach((step, index) => {
        const progressItem = document.createElement("div");

        progressItem.className = "profile-progress-step";

        if (index <= currentStep) {
            progressItem.classList.add("is-done");
        }

        if (index === currentStep) {
            progressItem.classList.add("is-current");
        }

        const circle = profileElement(
            "span",
            index < currentStep ? "✓" : String(index + 1),
            "profile-progress-circle"
        );

        const stepName = profileElement(
            "small",
            step
        );

        progressItem.append(circle, stepName);
        progress.appendChild(progressItem);
    });

    // Sipariş özeti
    const footer = document.createElement("div");
    footer.className = "profile-order-footer";

    const total = profileElement(
        "strong",
        ShoppingStore.money(
            Number(order.totals?.total || 0)
        )
    );

    const detailLink = profileElement(
        "a",
        "Sipariş Detayı →",
        "profile-action-link"
    );

    detailLink.href =
        "order-detail.html?id=" +
        encodeURIComponent(order.id);

    footer.append(total, detailLink);
    card.append(top, progress, footer);
    container.appendChild(card);
}

// ==========================================
// VARSAYILAN ADRES
// ==========================================

function renderDefaultAddress() {
    const container =
        document.getElementById("profileDefaultAddress");

    container.replaceChildren();

    const addresses = getProfileAddresses();

    if (addresses.length === 0) {
        const empty = document.createElement("div");
        empty.className = "profile-empty";

        const text = profileElement(
            "p",
            "Henüz kayıtlı teslimat adresiniz yok."
        );

        const link = profileElement(
            "a",
            "Yeni Adres Ekle →",
            "profile-action-link"
        );

        link.href = "addresses.html";

        empty.append(text, link);
        container.appendChild(empty);

        return;
    }

    const address =
        addresses.find(item => item.isDefault) ||
        addresses[0];

    const card = document.createElement("div");
    card.className = "profile-address-card";

    const heading = document.createElement("div");
    heading.className = "profile-address-heading";

    heading.append(
        profileElement(
            "strong",
            address.title || "Teslimat Adresi"
        ),
        profileElement(
            "span",
            address.isDefault
                ? "Varsayılan Adres"
                : "Kayıtlı Adres",
            "profile-address-label"
        )
    );

    const recipient = profileElement(
        "p",
        address.recipientName || ""
    );

    const location = profileElement(
        "p",
        [
            address.district,
            address.city
        ].filter(Boolean).join(" / ")
    );

    const line = profileElement(
        "p",
        address.line || ""
    );

    const editLink = profileElement(
        "a",
        "Adresi Yönet →",
        "profile-action-link"
    );

    editLink.href = "addresses.html";

    card.append(
        heading,
        recipient,
        location,
        line,
        editLink
    );

    container.appendChild(card);
}

// ==========================================
// PANELİ YENİLE
// ==========================================

function renderProfile() {
    renderProfileStats();
    renderLatestOrder();
    renderDefaultAddress();
}

// Başka bir sekmede sepet, adres veya sipariş
// değiştirildiğinde bilgileri yenile.
window.addEventListener("storage", event => {
    const keys = [
        ShoppingStore.CART_KEY,
        ShoppingStore.ADDRESS_KEY,
        ShoppingStore.ORDER_KEY,
        ProductStore.favoritesKey
    ];

    if (event.key === null || keys.includes(event.key)) {
        renderProfile();
    }
});

// Başka sayfadan geri dönüldüğünde yenile.
window.addEventListener("pageshow", () => {
    renderProfile();
});

document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
        renderProfile();
    }
});

renderProfile();
