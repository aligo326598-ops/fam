
"use strict";

/*
 FAM PHARMA TURKEY - ÜRÜN DETAY SAYFASI

 - Ürün bilgileri
 - Ön / arka fotoğraflar
 - Favorilere ekleme
 - Demo sepete ekleme
*/

const queryParams = new URLSearchParams(window.location.search);
const productId = queryParams.get("id");

const product = ProductStore.getById(productId);

const detailContent = document.getElementById("detailContent");
const detailError = document.getElementById("detailError");

const PLACEHOLDER_IMAGE = "images/ui/product-placeholder.svg";

if (!product) {
    detailContent.hidden = true;
    detailError.hidden = false;
} else {
    detailContent.hidden = false;
    detailError.hidden = true;

    // ==========================================
    // 1. ÜRÜN BİLGİLERİ
    // ==========================================

    document.title = product.name + " | FAM Pharma Turkey";

    document.getElementById("breadcrumbName").textContent =
        product.name;

    document.getElementById("detailName").textContent =
        product.name;

    document.getElementById("detailType").textContent =
        "Kategori: " + product.categoryName +
        " | Ürün Formu: " + product.type;

    const priceElement = document.getElementById("detailPrice");
    const stockElement = document.getElementById("detailStock");
    const descriptionElement =
        document.getElementById("detailDescription");

    if (priceElement) {
        priceElement.textContent =
            ProductStore.formatPrice(product.price);
    }

    if (stockElement) {
        if (product.stock === null ||
            product.stock === undefined) {
            stockElement.textContent =
                "Stok bilgisi henüz eklenmedi.";
        } else if (product.stock === 0) {
            stockElement.textContent = "Stokta yok";
        } else {
            stockElement.textContent =
                "Stokta " + product.stock + " adet mevcut";
        }
    }

    if (descriptionElement) {
        descriptionElement.textContent =
            product.description ||
            "Bu ürün için henüz açıklama eklenmedi.";
    }

    // ==========================================
    // 2. ÜRÜN GÖRSELLERİ
    // ==========================================

    const mainImage = document.getElementById("detailImage");
    const frontThumb = document.getElementById("frontThumb");
    const backThumb = document.getElementById("backThumb");

    const frontButton =
        document.getElementById("frontImageButton");

    const backButton =
        document.getElementById("backImageButton");

    const frontSrc = ProductStore.resolveImage(product.front);
    const backSrc = ProductStore.resolveImage(product.back);

    function setImageFallback(image) {
        if (!image) return;

        image.onerror = function () {
            this.onerror = null;
            this.src = PLACEHOLDER_IMAGE;
        };
    }

    [mainImage, frontThumb, backThumb].forEach(setImageFallback);

    if (frontThumb) {
        frontThumb.src = frontSrc;
        frontThumb.alt = product.name + " ön ambalajı";
    }

    if (backThumb) {
        backThumb.src = backSrc;
        backThumb.alt = product.name + " arka ambalajı";
    }

    function showImage(side) {
        const isFront = side === "front";

        if (mainImage) {
            mainImage.src = isFront ? frontSrc : backSrc;
            mainImage.alt = product.name +
                (isFront ? " ön ambalajı" : " arka ambalajı");
        }

        if (frontButton) {
            frontButton.classList.toggle("selected", isFront);
            frontButton.setAttribute(
                "aria-pressed",
                String(isFront)
            );
        }

        if (backButton) {
            backButton.classList.toggle("selected", !isFront);
            backButton.setAttribute(
                "aria-pressed",
                String(!isFront)
            );
        }
    }

    if (frontButton) {
        frontButton.addEventListener("click", () => {
            showImage("front");
        });
    }

    if (backButton) {
        backButton.addEventListener("click", () => {
            showImage("back");
        });
    }

    // ÖNEMLİ:
    // Görseli diğer işlemlerden önce gösteriyoruz.
    showImage("front");

    // ==========================================
    // 3. FAVORİLER
    // ==========================================

    const favoriteButton =
        document.getElementById("favoriteButton");

    const favoriteNotice =
        document.getElementById("favoriteNotice");

    function showNotice(message) {
        if (favoriteNotice) {
            favoriteNotice.textContent = message;
        }
    }

    function updateFavoriteButton() {
        if (!favoriteButton) return;

        const favorite = ProductStore.isFavorite(product.id);

        favoriteButton.textContent = favorite
            ? "♥ Favorilerden Çıkar"
            : "♡ Favorilere Ekle";

        favoriteButton.setAttribute(
            "aria-pressed",
            String(favorite)
        );
    }

    if (favoriteButton) {
        favoriteButton.addEventListener("click", () => {
            const wasFavorite =
                ProductStore.isFavorite(product.id);

            ProductStore.toggleFavorite(product.id);

            const isFavorite =
                ProductStore.isFavorite(product.id);

            updateFavoriteButton();

            if (wasFavorite === isFavorite) {
                showNotice("Favori işlemi kaydedilemedi.");
            } else {
                showNotice(isFavorite
                    ? "Ürün favorilerinize eklendi."
                    : "Ürün favorilerinizden çıkarıldı.");
            }
        });
    }

    updateFavoriteButton();

    // ==========================================
    // 4. SEPETE EKLE
    // ==========================================

    const cartButton = document.getElementById("cartButton");

    const shoppingAvailable =
        typeof ShoppingStore !== "undefined";

    const validProduct =
        shoppingAvailable &&
        ShoppingStore.validProduct(product);

    if (cartButton) {
        cartButton.disabled = !validProduct;

        if (!shoppingAvailable) {
            cartButton.title =
                "Sepet dosyası yüklenemedi.";

            showNotice(
                "Sepet sistemi yüklenemedi. " +
                "cart-store.js dosyasını kontrol edin."
            );

            console.error(
                "ShoppingStore bulunamadı. " +
                "cart-store.js dosyası yüklenmiş mi?"
            );
        } else if (!validProduct) {
            cartButton.title =
                "Ürünün fiyatı veya stok bilgisi uygun değil.";

            showNotice(
                "Sepete eklemek için ürünün fiyatı " +
                "belirlenmiş ve stok miktarı 0'dan " +
                "büyük olmalıdır."
            );
        } else {
            cartButton.title = "Ürünü sepete ekle";

            cartButton.addEventListener("click", () => {
                const result = ShoppingStore.add(
                    product.id,
                    1
                );

                if (!result.ok) {
                    showNotice(result.message);
                    return;
                }

                cartButton.textContent = "✓ Sepete Eklendi";

                showNotice(
                    "Ürün sepete eklendi. " +
                    "Sepetim sayfasından görüntüleyebilirsiniz."
                );

                // Sepet sayfasına geçiş bağlantısı
                let cartLink =
                    document.getElementById("goToCartLink");

                if (!cartLink) {
                    cartLink = document.createElement("a");
                    cartLink.id = "goToCartLink";
                    cartLink.href = "cart.html";
                    cartLink.className = "btn btn-outline";
                    cartLink.textContent = "Sepetime Git →";

                    const actions =
                        document.querySelector(".detail-actions");

                    if (actions) {
                        actions.appendChild(cartLink);
                    }
                }
            });
        }
    }
}
