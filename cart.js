
"use strict";

const cartItems = document.getElementById("cartItems");
const cartEmpty = document.getElementById("cartEmpty");
const checkoutLink = document.getElementById("checkoutLink");
const cartMessage = document.getElementById("cartMessage");

function cartImage(product) {
    const img = document.createElement("img");

    img.src = ProductStore.resolveImage(product.front);
    img.alt = product.name;

    img.onerror = () => {
        img.onerror = null;
        img.src = "images/ui/product-placeholder.svg";
    };

    return img;
}

function renderCart() {
    const items = ShoppingStore.detailedCart();
    cartItems.replaceChildren();

    const invalid = items.some(item =>
        !ShoppingStore.validProduct(item.product) ||
        item.quantity > item.product.stock
    );

    items.forEach(item => {
        const row = document.createElement("article");
        row.className = "shopping-cart-item";

        if (!item.product) {
            row.textContent =
                "Artık bulunmayan bir ürün sepette kayıtlı.";

            const remove = document.createElement("button");
            remove.type = "button";
            remove.textContent = "Kaldır";
            remove.className = "secondary-button";

            remove.onclick = () => {
                ShoppingStore.remove(item.productId);
                renderCart();
            };

            row.appendChild(remove);
            cartItems.appendChild(row);
            return;
        }

        const image = cartImage(item.product);

        const info = document.createElement("div");
        info.className = "shopping-cart-info";

        const title = document.createElement("a");
        title.href = ProductStore.detailUrl(item.productId);
        title.textContent = item.product.name;

        const price = document.createElement("p");
        price.textContent =
            ProductStore.formatPrice(item.product.price);

        const stock = document.createElement("small");
        stock.textContent = item.product.stock === null
            ? "Stok bilgisi yok"
            : "Mevcut stok: " + item.product.stock;

        const controls = document.createElement("div");
        controls.className = "shopping-quantity";

        const decrease = document.createElement("button");
        decrease.type = "button";
        decrease.textContent = "−";

        const number = document.createElement("strong");
        number.textContent = item.quantity;

        const increase = document.createElement("button");
        increase.type = "button";
        increase.textContent = "+";

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "shopping-remove";
        remove.textContent = "Kaldır";

        decrease.onclick = () => {
            ShoppingStore.setQuantity(
                item.productId,
                item.quantity - 1
            );
            renderCart();
        };

        increase.onclick = () => {
            if (!ShoppingStore.setQuantity(
                item.productId,
                item.quantity + 1
            )) {
                cartMessage.textContent =
                    "Stok miktarı aşılamaz.";
                return;
            }
            cartMessage.textContent = "";
            renderCart();
        };

        remove.onclick = () => {
            ShoppingStore.remove(item.productId);
            renderCart();
        };

        controls.append(decrease, number, increase);

        info.append(title, price, stock, controls, remove);
        row.append(image, info);
        cartItems.appendChild(row);
    });

    const totals = ShoppingStore.totals();

    document.getElementById("cartSubtotal").textContent =
        ShoppingStore.money(totals.subtotal);

    document.getElementById("cartShipping").textContent =
        totals.shipping === 0
            ? "Ücretsiz"
            : ShoppingStore.money(totals.shipping);

    document.getElementById("cartTotal").textContent =
        ShoppingStore.money(
            totals.subtotal + totals.shipping
        );

    cartEmpty.hidden = items.length !== 0;

    checkoutLink.hidden = !items.length || invalid;

    cartMessage.textContent = invalid
        ? "Sepette fiyatı veya stoku geçersiz ürün var. " +
          "Devam etmek için sepeti düzenleyin."
        : "";
}

renderCart();
