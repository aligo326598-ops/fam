"use strict";

const featuredContainer =
    document.getElementById("featuredProducts");

if (featuredContainer) {
    const allProducts = ProductStore.all();

    // Önce Admin'den eklenen ürünler gösterilir.
    // Yalnızca 3 ürün ana sayfada yer alır.
    allProducts.slice(0, 3).forEach(product => {
        const card = document.createElement("article");
        card.className = "product-card";

        const imageLink = document.createElement("a");
        imageLink.className = "product-image";
        imageLink.href = ProductStore.detailUrl(product.id);

        const image = document.createElement("img");
        image.src = ProductStore.resolveImage(product.front);
        image.alt = product.name;
        image.loading = "lazy";

        image.onerror = () => {
            image.onerror = null;
            // Düzeltildi: Kök dizindeki placeholder dosyası (veya uygun bir görsel adı) yazıldı
            image.src = "product-placeholder.svg"; 
        };

        imageLink.appendChild(image);

        const details = document.createElement("div");
        details.className = "product-details";

        const type = document.createElement("span");
        type.className = "product-brand";
        type.textContent = product.categoryName;

        const name = document.createElement("h3");
        name.textContent = product.name;

        const price = document.createElement("p");
        price.className = "product-type";
        price.textContent =
            ProductStore.formatPrice(product.price);

        const link = document.createElement("a");
        link.className = "view-product-btn";
        link.href = ProductStore.detailUrl(product.id);
        link.textContent = "Ürünü İncele →";

        details.append(type, name, price, link);
        card.append(imageLink, details);

        featuredContainer.appendChild(card);
    });
}

// HERO
const heroImage = document.getElementById("heroProductImage");

if (heroImage) {
    // Düzeltildi: Klasör yolu kaldırıldı, doğrudan kök dizindeki dosya adı yazıldı
    heroImage.src = "atoz25-front.jpeg";

    heroImage.alt = "Fullvits A to Z 25 Vitamins";

    heroImage.onerror = function () {
        this.onerror = null;
        // Düzeltildi: Kök dizindeki placeholder dosyası yazıldı
        this.src = "product-placeholder.svg";
    };
}

// MOBİL MENÜ
const menuToggle = document.querySelector(".menu-toggle");
const mobileNav = document.getElementById("mobileNav");

if (menuToggle && mobileNav) {
    function closeMenu() {
        mobileNav.hidden = true;
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.textContent = "☰";
    }

    menuToggle.addEventListener("click", () => {
        const opening = mobileNav.hidden;

        mobileNav.hidden = !opening;
        menuToggle.setAttribute(
            "aria-expanded",
            String(opening)
        );

        menuToggle.textContent = opening ? "×" : "☰";
    });

    mobileNav.querySelectorAll("a").link?.forEach?.(link => { // güvenli hale getirildi
        link.addEventListener("click", closeMenu);
    });

    // Orijinal kodunuzdaki döngü yapısı:
    mobileNav.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", closeMenu);
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 900) closeMenu();
    });

    closeMenu();
}

// FOOTER
const year = document.getElementById("year");

if (year) {
    year.textContent = new Date().getFullYear();
}