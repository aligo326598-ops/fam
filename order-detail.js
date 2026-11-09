
"use strict";

const ORDER_STEPS = [
    "Sipariş Alındı",
    "Hazırlanıyor",
    "Kargoda",
    "Teslim Edildi"
];

const params = new URLSearchParams(window.location.search);
const orderId = params.get("id");

const order = ShoppingStore.orders().find(
    item => item.id === orderId
);

const notFound = document.getElementById("orderNotFound");
const content = document.getElementById("orderDetailContent");

function addText(parent, tag, value, className = "") {
    const element = document.createElement(tag);
    element.textContent = value;

    if (className) element.className = className;

    parent.appendChild(element);
    return element;
}

if (!order) {
    notFound.hidden = false;
} else {
    content.hidden = false;

    document.title =
        order.number + " | FAM Pharma Turkey";

    document.getElementById("orderNumber").textContent =
        "Sipariş No: " + order.number;

    document.getElementById("orderDate").textContent =
        "Oluşturulma: " +
        new Date(order.date).toLocaleString("tr-TR");

    const status = ORDER_STEPS.includes(order.status)
        ? order.status
        : "Sipariş Alındı";

    document.getElementById("currentOrderStatus").textContent =
        status;

    const activeIndex = ORDER_STEPS.indexOf(status);
    const tracking = document.getElementById("orderTracking");

    ORDER_STEPS.forEach((step, index) => {
        const item = document.createElement("div");

        item.className = "tracking-step";

        if (index < activeIndex) {
            item.classList.add("completed");
        } else if (index === activeIndex) {
            item.classList.add("current");
        }

        const number = addText(
            item,
            "span",
            index < activeIndex ? "✓" : String(index + 1),
            "tracking-number"
        );

        addText(item, "strong", step);

        if (index === activeIndex) {
            addText(item, "small", "Güncel durum");
        } else if (index < activeIndex) {
            addText(item, "small", "Tamamlandı");
        } else {
            addText(item, "small", "Bekleniyor");
        }

        tracking.appendChild(item);
    });

    // Ürünler
    const itemsContainer =
        document.getElementById("orderDetailItems");

    order.items.forEach(item => {
        const row = document.createElement("div");
        row.className = "summary-line";

        addText(
            row,
            "span",
            item.name + " × " + item.quantity
        );

        addText(
            row,
            "strong",
            ShoppingStore.money(item.price * item.quantity)
        );

        itemsContainer.appendChild(row);
    });

    // Sipariş oluşturulurken kaydedilen adresi göster.
    const address = order.address;

    const addressBox = document.getElementById("orderAddress");

    addText(addressBox, "strong", address.recipientName);
    addText(addressBox, "p", address.phone);
    addText(
        addressBox,
        "p",
        address.district + " / " + address.city
    );
    addText(addressBox, "p", address.line);

    if (address.postalCode) {
        addText(
            addressBox,
            "p",
            "Posta Kodu: " + address.postalCode
        );
    }

    // Ödeme
    document.getElementById("orderPaymentMethod").textContent =
        "Ödeme Yöntemi: " +
        (order.paymentMethod === "cod"
            ? "Kapıda Ödeme"
            : "Kartla Ödeme");

    document.getElementById("orderPaymentStatus").textContent =
        "Ödeme Durumu: " +
        (order.paymentStatus || "Ödeme alınmadı");

    // Ücretler: sipariş anındaki tutarları kullan.
    const totals = order.totals;

    document.getElementById("detailSubtotal").textContent =
        ShoppingStore.money(totals.subtotal);

    document.getElementById("detailShipping").textContent =
        totals.shipping === 0
            ? "Ücretsiz"
            : ShoppingStore.money(totals.shipping);

    document.getElementById("detailCodFee").textContent =
        ShoppingStore.money(totals.codFee);

    document.getElementById("detailTotal").textContent =
        ShoppingStore.money(totals.total);
}
