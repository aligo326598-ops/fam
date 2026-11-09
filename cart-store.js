
"use strict";

const ShoppingStore = {
    CART_KEY: "fam_demo_cart_v1",
    ADDRESS_KEY: "fam_demo_addresses_v1",
    ORDER_KEY: "fam_demo_orders_v1",

    read(key) {
        try {
            const data = JSON.parse(
                localStorage.getItem(key) || "[]"
            );
            return Array.isArray(data) ? data : [];
        } catch {
            return [];
        }
    },

    save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch {
            return false;
        }
    },

    id() {
        return crypto.randomUUID();
    },

    money(value) {
        return Number(value).toLocaleString("tr-TR", {
            style: "currency",
            currency: "TRY"
        });
    },

    products() {
        return ProductStore.all();
    },

    cart() {
        return this.read(this.CART_KEY);
    },

    validProduct(product) {
        return product &&
            product.price !== null &&
            Number.isFinite(product.price) &&
            product.price >= 0 &&
            Number.isSafeInteger(product.stock) &&
            product.stock > 0;
    },

    add(productId, quantity = 1) {
        const product = ProductStore.getById(productId);

        if (!this.validProduct(product)) {
            return {
                ok: false,
                message: "Bu ürün henüz satışa hazır değil."
            };
        }

        const cart = this.cart();
        const item = cart.find(
            x => String(x.productId) === String(productId)
        );

        const existingQuantity = item ? item.quantity : 0;

        if (existingQuantity + quantity > product.stock) {
            return {
                ok: false,
                message: "Stok miktarı aşılamaz."
            };
        }

        if (item) {
            item.quantity += quantity;
        } else {
            cart.push({
                productId: String(productId),
                quantity
            });
        }

        if (!this.save(this.CART_KEY, cart)) {
            return {
                ok: false,
                message: "Sepet kaydedilemedi."
            };
        }

        return {
            ok: true,
            message: "Ürün sepete eklendi."
        };
    },

    remove(productId) {
        return this.save(
            this.CART_KEY,
            this.cart().filter(
                x => String(x.productId) !== String(productId)
            )
        );
    },

    setQuantity(productId, quantity) {
        const product = ProductStore.getById(productId);

        if (!Number.isSafeInteger(quantity)) return false;

        if (quantity <= 0) {
            return this.remove(productId);
        }

        if (!this.validProduct(product) ||
            quantity > product.stock) {
            return false;
        }

        const cart = this.cart();
        const item = cart.find(
            x => String(x.productId) === String(productId)
        );

        if (!item) return false;

        item.quantity = quantity;
        return this.save(this.CART_KEY, cart);
    },

    detailedCart() {
        return this.cart().map(item => {
            const product = ProductStore.getById(item.productId);

            return {
                ...item,
                product
            };
        });
    },

    subtotal() {
        return this.detailedCart().reduce((sum, item) => {
            if (!item.product ||
                item.product.price === null ||
                !Number.isFinite(item.product.price)) {
                return sum;
            }

            return sum +
                item.product.price * item.quantity;
        }, 0);
    },

    totals(method = "card") {
        const subtotal = this.subtotal();
        const shipping = subtotal >= 1000 ? 0 : 100;
        const codFee = method === "cod" ? 50 : 0;

        return {
            subtotal,
            shipping,
            codFee,
            total: Math.round(
                (subtotal + shipping + codFee) * 100
            ) / 100
        };
    },

    addresses() {
        return this.read(this.ADDRESS_KEY);
    },

    addAddress(address) {
        const list = this.addresses();

        if (list.length === 0 || address.isDefault) {
            list.forEach(x => x.isDefault = false);
            address.isDefault = true;
        }

        list.push({
            ...address,
            id: this.id()
        });

        return this.save(this.ADDRESS_KEY, list);
    },

    removeAddress(id) {
        const remaining = this.addresses().filter(
            x => x.id !== id
        );

        if (remaining.length &&
            !remaining.some(x => x.isDefault)) {
            remaining[0].isDefault = true;
        }

        return this.save(this.ADDRESS_KEY, remaining);
    },

    setDefaultAddress(id) {
        const list = this.addresses();

        if (!list.some(x => x.id === id)) return false;

        list.forEach(x => {
            x.isDefault = x.id === id;
        });

        return this.save(this.ADDRESS_KEY, list);
    },

    orders() {
        return this.read(this.ORDER_KEY);
    },

createDemoOrder(address, method) {
    if (!["card", "cod"].includes(method)) {
        return {
            ok: false,
            message: "Geçersiz ödeme yöntemi."
        };
    }

    const cart = this.detailedCart();

    if (!cart.length) {
        return {
            ok: false,
            message: "Sepetiniz boş."
        };
    }

    const rawProducts = this.read(
    ProductStore.adminProductsKey
   );

    const updatedProducts = rawProducts.map(p => ({ ...p }));
    const orderItems = [];

    // Bütün ürünleri ve stokları kontrol et.
    for (const item of cart) {
        const product = item.product;

        if (
            !product ||
            !this.validProduct(product) ||
            !Number.isSafeInteger(item.quantity) ||
            item.quantity <= 0
        ) {
            return {
                ok: false,
                message: "Sepette geçersiz ürün veya miktar var."
            };
        }

        const rawProduct = updatedProducts.find(
            p => String(p.id) === String(item.productId)
        );

        if (
            !rawProduct ||
            rawProduct.stock === null ||
            rawProduct.stock === undefined ||
            rawProduct.stock === ""
        ) {
            return {
                ok: false,
                message: product.name +
                    " için stok bilgisi bulunamadı."
            };
        }

        const currentStock = Number(rawProduct.stock);

        if (
            !Number.isSafeInteger(currentStock) ||
            currentStock < item.quantity
        ) {
            return {
                ok: false,
                message: product.name +
                    " için yeterli stok bulunmuyor."
            };
        }

        // DEMO: Sipariş edilen miktarı stoktan düş.
        rawProduct.stock = currentStock - item.quantity;

        orderItems.push({
            productId: String(product.id),
            sku: product.sku || "",
            name: product.name,
            price: product.price,
            quantity: item.quantity,
            image: product.front || ""
        });
    }

    const totals = this.totals(method);
    const now = new Date();

    const datePart =
        now.getFullYear().toString() +
        String(now.getMonth() + 1).padStart(2, "0") +
        String(now.getDate()).padStart(2, "0");

    const randomPart = this.id()
        .replace(/-/g, "")
        .slice(0, 10)
        .toUpperCase();

    const order = {
        id: this.id(),
        number: `FAM-${datePart}-${randomPart}`,
        date: now.toISOString(),

        status: "Sipariş Alındı",

        paymentStatus: "Ödeme alınmadı",
        paymentMethod: method,

        address: { ...address },
        totals: { ...totals },
        items: orderItems,

        // Yalnızca demo stok hareketinin işaretidir.
        demoStockReduced: true
    };

    const previousProductsText =
        localStorage.getItem(ProductStore.adminProductsKey);

    const previousOrdersText =
        localStorage.getItem(this.ORDER_KEY);

    const nextOrders = [order, ...this.orders()];

    try {
        // Ürün stoklarını ve demo siparişini kaydet.
        localStorage.setItem(
            ProductStore.adminProductsKey,
            JSON.stringify(updatedProducts)
        );

        localStorage.setItem(
            this.ORDER_KEY,
            JSON.stringify(nextOrders)
        );
    } catch (error) {
        // Kayıt başarısızsa eski değerlere dönmeyi dene.
        try {
            if (previousProductsText === null) {
                localStorage.removeItem(
                    ProductStore.adminProductsKey
                );
            } else {
                localStorage.setItem(
                    ProductStore.adminProductsKey,
                    previousProductsText
                );
            }

            if (previousOrdersText === null) {
                localStorage.removeItem(this.ORDER_KEY);
            } else {
                localStorage.setItem(
                    this.ORDER_KEY,
                    previousOrdersText
                );
            }
        } catch (rollbackError) {
            console.error(
                "Demo kayıtları geri yüklenemedi:",
                rollbackError
            );
        }

        console.error("Sipariş kayıt hatası:", error);

        return {
            ok: false,
            message: "Sipariş kaydedilemedi. " +
                "Demo verilerini kontrol edin."
        };
    }

    // Sipariş kaydedildi; sepeti temizlemeyi dene.
    if (!this.save(this.CART_KEY, [])) {
        console.warn(
            "Sipariş kaydedildi fakat sepet temizlenemedi."
        );
    }

    return {
        ok: true,
        order
    };
}

};
