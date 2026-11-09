
"use strict";

const grid = document.getElementById("productsGrid");
const search = document.getElementById("productSearch");
const category = document.getElementById("categoryFilter");
const count = document.getElementById("productCount");
const emptyState = document.getElementById("emptyState");
const clearButton = document.getElementById("clearFilters");

// Admin tarafından eklenen kategorileri filtreye dahil et.
ProductStore.categories().forEach(item => {
    const exists = [...category.options].some(
        option => option.value === item.name
    );

    if (!exists) {
        category.add(new Option(item.name, item.name));
    }
});

const params = new URLSearchParams(window.location.search);
const selectedFromUrl = params.get("category");

if ([...category.options].some(
    option => option.value === selectedFromUrl
)) {
    category.value = selectedFromUrl;
}

function createProductCard(product) {
    const card = document.createElement("article");
    card.className = "product-card";

    const imageLink = document.createElement("a");
    imageLink.href = ProductStore.detailUrl(product.id);
    imageLink.className = "product-image";

    const image = document.createElement("img");
    image.src = ProductStore.resolveImage(product.front);
    image.alt = product.name + " ön görseli";
    image.loading = "lazy";

    image.onerror = () => {
        image.onerror = null;
        image.src = "images/ui/product-placeholder.svg";
    };

    imageLink.appendChild(image);

    const details = document.createElement("div");
    details.className = "product-details";

    const type = document.createElement("span");
    type.className = "product-brand";
    type.textContent = product.categoryName;

    const title = document.createElement("h3");
    title.textContent = product.name;

    const price = document.createElement("p");
    price.className = "product-type";
    price.textContent = ProductStore.formatPrice(product.price);

    const stock = document.createElement("p");
    stock.className = "product-type";

    if (product.stock === null) {
        stock.textContent = "Stok bilgisi henüz eklenmedi";
    } else if (product.stock === 0) {
        stock.textContent = "Stokta yok";
    } else {
        stock.textContent = "Stokta: " + product.stock + " adet";
    }

    const button = document.createElement("a");
    button.className = "view-product-btn";
    button.href = ProductStore.detailUrl(product.id);
    button.textContent = "Ürün Detaylarını Gör →";

    details.append(type, title, price, stock, button);
    card.append(imageLink, details);

    return card;
}

function renderCatalog() {
    const term = search.value
        .trim()
        .toLocaleLowerCase("tr-TR");

    const selected = category.value;

    const results = ProductStore.all().filter(product => {
        const searchable = [
            product.name,
            product.brand,
            product.sku
        ].join(" ").toLocaleLowerCase("tr-TR");

        const matchesSearch = searchable.includes(term);

        const matchesCategory =
            selected === "Tümü" ||
            product.type === selected ||
            product.categoryName === selected;

        return matchesSearch && matchesCategory;
    });

    grid.replaceChildren(
        ...results.map(createProductCard)
    );

    count.textContent = results.length + " ürün görüntüleniyor";
    emptyState.hidden = results.length !== 0;
}

function updateFilterUrl() {
    const url = new URL(window.location.href);

    if (category.value === "Tümü") {
        url.searchParams.delete("category");
    } else {
        url.searchParams.set("category", category.value);
    }

    history.replaceState(
        null,
        "",
        url.pathname + url.search
    );
}

search.addEventListener("input", renderCatalog);

category.addEventListener("change", () => {
    updateFilterUrl();
    renderCatalog();
});

clearButton.addEventListener("click", () => {
    search.value = "";
    category.value = "Tümü";

    updateFilterUrl();
    renderCatalog();
});

window.addEventListener("storage", event => {
    if (
        event.key === ProductStore.adminProductsKey ||
        event.key === ProductStore.adminCategoriesKey
    ) {
        window.location.reload();
    }
});

renderCatalog();
