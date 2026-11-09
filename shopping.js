
"use strict";

const API_BASE = "https://api.turkiyeapi.dev/v2";

async function fetchLocationData(url) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Konum bilgileri alınamadı.");
    }

    const result = await response.json();

    if (!Array.isArray(result.data)) {
        throw new Error("Beklenmeyen API yanıtı.");
    }

    return result.data;
}

function locationOption(label, value) {
    return new Option(label, value);
}

function showMessage(id, message) {
    const element = document.getElementById(id);
    if (element) element.textContent = message;
}


/* ==========================================
   ADRESLERİM - EKLE / DÜZENLE / SİL
========================================== */

const addressForm = document.getElementById("addressForm");

if (addressForm) {

    const province = document.getElementById("province");
    const district = document.getElementById("district");

    const addressList = document.getElementById("addressList");

    const submitButton = addressForm.querySelector(
        'button[type="submit"]'
    );

    let editingAddressId = null;
    let districtRequestId = 0;

    // Düzenleme iptal butonunu oluştur.
    const cancelEditButton = document.createElement("button");

    cancelEditButton.type = "button";
    cancelEditButton.textContent = "Düzenlemeyi İptal Et";
    cancelEditButton.className = "secondary-button";
    cancelEditButton.hidden = true;

    submitButton.insertAdjacentElement(
        "afterend",
        cancelEditButton
    );

    function setAddressMessage(message) {
        showMessage("addressMessage", message);
    }

    function resetDistrict() {
        districtRequestId++;

        district.replaceChildren(
            new Option("Önce il seçiniz", "")
        );

        district.disabled = true;
    }

    // ==========================================
    // İLLERİ YÜKLE
    // ==========================================

    async function loadProvinces() {
        province.disabled = true;

        province.replaceChildren(
            new Option("İller yükleniyor...", "")
        );

        try {
            const provinces = await fetchLocationData(
                API_BASE +
                "/provinces?limit=100&fields=id,name"
            );

            provinces.sort((a, b) =>
                a.name.localeCompare(b.name, "tr")
            );

            province.replaceChildren(
                new Option("İl seçiniz", "")
            );

            provinces.forEach(item => {
                province.add(
                    new Option(
                        item.name,
                        String(item.id)
                    )
                );
            });

            province.disabled = false;

            return true;

        } catch (error) {
            province.replaceChildren(
                new Option("İller yüklenemedi", "")
            );

            setAddressMessage(
                "İl listesi alınamadı. " +
                "İnternet bağlantısını kontrol edin."
            );

            console.error("İl yükleme hatası:", error);

            return false;
        }
    }

    // ==========================================
    // SEÇİLEN İLİN İLÇELERİNİ YÜKLE
    // ==========================================

    async function loadDistricts(
        provinceId,
        selectedDistrictId = ""
    ) {
        const requestId = ++districtRequestId;

        district.disabled = true;

        district.replaceChildren(
            new Option("İlçeler yükleniyor...", "")
        );

        if (!provinceId) {
            resetDistrict();
            return false;
        }

        try {
            const districts = await fetchLocationData(
                API_BASE +
                "/provinces/" +
                encodeURIComponent(provinceId) +
                "/districts?limit=100&fields=id,name"
            );

            // Kullanıcı il değiştirirken eski API
            // yanıtının yeni ilçeleri ezmesini önle.
            if (requestId !== districtRequestId) {
                return false;
            }

            districts.sort((a, b) =>
                a.name.localeCompare(b.name, "tr")
            );

            district.replaceChildren(
                new Option("İlçe seçiniz", "")
            );

            districts.forEach(item => {
                district.add(
                    new Option(
                        item.name,
                        String(item.id)
                    )
                );
            });

            if (selectedDistrictId) {
                district.value = String(selectedDistrictId);
            }

            district.disabled = false;

            return true;

        } catch (error) {
            if (requestId !== districtRequestId) {
                return false;
            }

            district.replaceChildren(
                new Option("İlçeler yüklenemedi", "")
            );

            setAddressMessage(
                "İlçe listesi alınamadı. Tekrar deneyin."
            );

            console.error("İlçe yükleme hatası:", error);

            return false;
        }
    }

    province.addEventListener("change", () => {
        setAddressMessage("");

        if (!province.value) {
            resetDistrict();
            return;
        }

        loadDistricts(province.value);
    });

    // ==========================================
    // FORMU NORMAL HALE GETİR
    // ==========================================

    function resetAddressForm() {
        editingAddressId = null;

        addressForm.reset();
        resetDistrict();

        submitButton.textContent = "Adresi Kaydet";
        cancelEditButton.hidden = true;

        setAddressMessage("");
    }

    cancelEditButton.addEventListener(
        "click",
        resetAddressForm
    );

    // ==========================================
    // ADRES DÜZENLEMEYİ BAŞLAT
    // ==========================================

    async function editAddress(addressId) {
        const address = ShoppingStore.addresses().find(
            x => x.id === addressId
        );

        if (!address) {
            setAddressMessage("Adres bulunamadı.");
            return;
        }

        editingAddressId = address.id;

        document.getElementById("addressTitle").value =
            address.title || "";

        document.getElementById("recipientName").value =
            address.recipientName || "";

        document.getElementById("recipientPhone").value =
            address.phone || "";

        document.getElementById("postalCode").value =
            address.postalCode || "";

        document.getElementById("addressLine").value =
            address.line || "";

        document.getElementById("defaultAddress").checked =
            Boolean(address.isDefault);

        submitButton.textContent = "Değişiklikleri Kaydet";

        cancelEditButton.hidden = false;

        setAddressMessage(
            "Adres düzenleme modundasınız."
        );

        province.value = String(address.cityId || "");

        if (province.value) {
            await loadDistricts(
                province.value,
                address.districtId
            );
        } else {
            resetDistrict();

            setAddressMessage(
                "Eski adresin il bilgisi eşleşmedi. " +
                "Lütfen ili ve ilçeyi yeniden seçin."
            );
        }

        addressForm.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    // ==========================================
    // KAYITLI ADRESLERİ GÖSTER
    // ==========================================

    function renderAddresses() {
        addressList.replaceChildren();

        const addresses = ShoppingStore.addresses();

        if (addresses.length === 0) {
            const empty = document.createElement("p");

            empty.className = "summary-note";
            empty.textContent =
                "Henüz kayıtlı adresiniz bulunmuyor.";

            addressList.appendChild(empty);
            return;
        }

        addresses.forEach(address => {
            const card = document.createElement("article");

            card.className = "saved-address";

            const title = document.createElement("h3");

            title.textContent =
                address.title +
                (address.isDefault ? " • Varsayılan" : "");

            const person = document.createElement("p");

            person.textContent =
                address.recipientName + " | " +
                address.phone;

            const location = document.createElement("p");

            location.textContent =
                address.district + " / " +
                address.city;

            const addressText = document.createElement("p");

            addressText.textContent = address.line;

            const actions = document.createElement("div");

            actions.className = "shopping-actions";

            // DÜZENLE
            const editButton = document.createElement("button");

            editButton.type = "button";
            editButton.textContent = "Düzenle";

            editButton.addEventListener("click", () => {
                editAddress(address.id);
            });

            // VARSAYILAN YAP
            const defaultButton =
                document.createElement("button");

            defaultButton.type = "button";
            defaultButton.textContent = "Varsayılan Yap";
            defaultButton.disabled = Boolean(address.isDefault);

            defaultButton.addEventListener("click", () => {
                if (ShoppingStore.setDefaultAddress(address.id)) {
                    renderAddresses();
                    setAddressMessage(
                        "Varsayılan adres güncellendi."
                    );
                }
            });

            // SİL
            const removeButton =
                document.createElement("button");

            removeButton.type = "button";
            removeButton.textContent = "Sil";

            removeButton.addEventListener("click", () => {
                if (!confirm(
                    "Bu adresi silmek istiyor musunuz?"
                )) {
                    return;
                }

                if (ShoppingStore.removeAddress(address.id)) {

                    if (editingAddressId === address.id) {
                        resetAddressForm();
                    }

                    renderAddresses();

                    setAddressMessage("Adres silindi.");
                } else {
                    setAddressMessage(
                        "Adres silinemedi."
                    );
                }
            });

            actions.append(
                editButton,
                defaultButton,
                removeButton
            );

            card.append(
                title,
                person,
                location,
                addressText,
                actions
            );

            addressList.appendChild(card);
        });
    }

    // ==========================================
    // ADRES EKLEME VE GÜNCELLEME
    // ==========================================

    addressForm.addEventListener("submit", event => {
        event.preventDefault();

        if (
            province.disabled ||
            district.disabled ||
            !province.value ||
            !district.value
        ) {
            setAddressMessage(
                "Geçerli bir il ve ilçe seçmelisiniz."
            );
            return;
        }

        const addressData = {
            title: document.getElementById("addressTitle")
                .value.trim(),

            recipientName: document.getElementById("recipientName")
                .value.trim(),

            phone: document.getElementById("recipientPhone")
                .value.trim(),

            city: province.selectedOptions[0].textContent,
            cityId: province.value,

            district: district.selectedOptions[0].textContent,
            districtId: district.value,

            postalCode: document.getElementById("postalCode")
                .value.trim(),

            line: document.getElementById("addressLine")
                .value.trim(),

            isDefault:
                document.getElementById("defaultAddress").checked
        };

        if (
            !addressData.title ||
            !addressData.recipientName ||
            !addressData.phone ||
            !addressData.line
        ) {
            setAddressMessage(
                "Zorunlu alanları doldurun."
            );
            return;
        }

        // ADRES DÜZENLEME
        if (editingAddressId !== null) {
            const addresses = ShoppingStore.addresses();

            const index = addresses.findIndex(
                x => x.id === editingAddressId
            );

            if (index === -1) {
                setAddressMessage(
                    "Düzenlenecek adres bulunamadı."
                );
                return;
            }

            const previous = addresses[index];

            const shouldBeDefault =
                addressData.isDefault ||
                previous.isDefault;

            if (shouldBeDefault) {
                addresses.forEach(x => {
                    x.isDefault = false;
                });
            }

            addresses[index] = {
                ...previous,
                ...addressData,
                id: previous.id,
                isDefault: shouldBeDefault
            };

            if (
                ShoppingStore.save(
                    ShoppingStore.ADDRESS_KEY,
                    addresses
                )
            ) {
                resetAddressForm();
                renderAddresses();

                setAddressMessage(
                    "Adres başarıyla güncellendi."
                );
            } else {
                setAddressMessage(
                    "Adres güncellenemedi."
                );
            }

            return;
        }

        // YENİ ADRES EKLEME
        if (ShoppingStore.addAddress(addressData)) {
            resetAddressForm();
            renderAddresses();

            setAddressMessage(
                "Yeni adres başarıyla eklendi."
            );
        } else {
            setAddressMessage(
                "Adres kaydedilemedi."
            );
        }
    });

    // ==========================================
    // SAYFA İLK AÇILIŞ
    // ==========================================

    loadProvinces();
    renderAddresses();
}

// ==========================================
// SİPARİŞ TAMAMLAMA
// ==========================================

const checkoutForm = document.getElementById("checkoutForm");

if (checkoutForm) {
    const addressSelect =
        document.getElementById("checkoutAddress");

    const addresses = ShoppingStore.addresses();

    addresses.forEach(address => {
        const option = new Option(
            address.title + " — " +
            address.district + " / " + address.city,
            address.id
        );

        addressSelect.add(option);
    });

    const defaultAddress = addresses.find(
        address => address.isDefault
    );

    if (defaultAddress) {
        addressSelect.value = defaultAddress.id;
    }

    const checkoutProducts =
        document.getElementById("checkoutProducts");

    const cart = ShoppingStore.detailedCart();

    let cartValid = cart.length > 0;

    cart.forEach(item => {
        const line = document.createElement("div");
        line.className = "summary-line";

        const name = document.createElement("span");
        name.textContent = item.product
            ? item.product.name + " × " + item.quantity
            : "Bulunamayan ürün";

        const total = document.createElement("strong");

        total.textContent = item.product &&
            item.product.price !== null
            ? ShoppingStore.money(
                item.product.price * item.quantity
            )
            : "—";

        if (!ShoppingStore.validProduct(item.product) ||
            item.quantity > item.product.stock) {
            cartValid = false;
        }

        line.append(name, total);
        checkoutProducts.appendChild(line);
    });

    const orderButton =
        document.getElementById("placeOrderButton");

    orderButton.disabled = !cartValid || addresses.length === 0;

    function selectedMethod() {
        return document.querySelector(
            'input[name="paymentMethod"]:checked'
        ).value;
    }

    function renderTotals() {
        const totals = ShoppingStore.totals(selectedMethod());

        document.getElementById("checkoutSubtotal").textContent =
            ShoppingStore.money(totals.subtotal);

        document.getElementById("checkoutShipping").textContent =
            totals.shipping === 0
                ? "Ücretsiz"
                : ShoppingStore.money(totals.shipping);

        document.getElementById("checkoutCodFee").textContent =
            ShoppingStore.money(totals.codFee);

        document.getElementById("checkoutTotal").textContent =
            ShoppingStore.money(totals.total);
    }

    document.querySelectorAll(
        'input[name="paymentMethod"]'
    ).forEach(input => {
        input.addEventListener("change", renderTotals);
    });

    checkoutForm.addEventListener("submit", event => {
        event.preventDefault();

        const address = ShoppingStore.addresses().find(
            a => a.id === addressSelect.value
        );

        if (!address || !cartValid) {
            showMessage(
                "checkoutMessage",
                "Adres veya sepet bilgileri geçerli değil."
            );
            return;
        }

        // Çift tıklamaya karşı devre dışı bırak.
        orderButton.disabled = true;

        const result = ShoppingStore.createDemoOrder(
            address,
            selectedMethod()
        );

        if (!result.ok) {
            orderButton.disabled = false;
            showMessage("checkoutMessage", result.message);
            return;
        }

        window.location.href =
            "orders.html?created=" +
            encodeURIComponent(result.order.id);
    });

    if (!cartValid) {
        showMessage(
            "checkoutMessage",
            "Sepet boş veya ürün bilgileri uygun değil."
        );
    } else if (addresses.length === 0) {
        showMessage(
            "checkoutMessage",
            "Önce Adreslerim bölümünden adres ekleyin."
        );
    }

    renderTotals();
}

// ==========================================
// SİPARİŞLERİM - DEMO KAYITLAR
// ==========================================

const ordersList = document.getElementById("ordersList");

if (ordersList) {
    const orders = ShoppingStore.orders();

    if (orders.length === 0) {
        const empty = document.createElement("div");
        empty.className = "shopping-panel";
        empty.textContent =
            "Henüz demo siparişiniz bulunmuyor.";
        ordersList.appendChild(empty);
    }

    orders.forEach(order => {
        const card = document.createElement("article");
        card.className = "shopping-panel shopping-order";

        const title = document.createElement("h2");
        title.textContent = order.number;

        const meta = document.createElement("p");
        meta.textContent =
            new Date(order.date).toLocaleString("tr-TR") +
            " • " +
            (order.paymentMethod === "cod"
                ? "Kapıda ödeme"
                : "Kartla ödeme seçimi") +
            " • Ödeme alınmadı";

        const details = document.createElement("div");

        order.items.forEach(item => {
            const row = document.createElement("div");
            row.className = "summary-line";

            const label = document.createElement("span");
            label.textContent =
                item.name + " × " + item.quantity;

            const price = document.createElement("strong");
            price.textContent = ShoppingStore.money(
                item.price * item.quantity
            );

            row.append(label, price);
            details.appendChild(row);
        });

        const shipping = document.createElement("p");
        shipping.textContent =
            "Teslimat adresi: " +
            order.address.district + " / " +
            order.address.city + " — " +
            order.address.line;

        const total = document.createElement("strong");
        total.textContent =
            "Demo Toplam: " +
            ShoppingStore.money(order.totals.total);

        const detailLink = document.createElement("a");
        detailLink.href =
        "order-detail.html?id=" + encodeURIComponent(order.id);
        detailLink.className = "order-detail-link";
        detailLink.textContent = "Sipariş Detayını Gör →";
        
        card.append(title, meta, details, shipping, total, detailLink);
        ordersList.appendChild(card);
    });
}
