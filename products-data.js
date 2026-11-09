
"use strict";

/*
 FAM PHARMA TURKEY
 ORTAK DEMO ÜRÜN YÖNETİMİ

 Admin ve mağaza aynı localStorage kayıtlarını kullanır.
 Gerçek SQL Server bağlantısı henüz yoktur.
*/

const PRODUCT_KEY = "fam_admin_demo_products";
const CATEGORY_KEY = "fam_admin_demo_categories";
const INIT_KEY = "fam_catalog_initialized_v2";
const FAVORITES_KEY = "fam_preview_favorites";

const defaultCategories = [
    { id: "base-kapsul", name: "Kapsül" },
    { id: "base-surup", name: "Şurup" },
    { id: "base-tablet", name: "Tablet" },
    { id: "base-diger", name: "Diğer" }
];

const initialProducts = [
    {
        name: "A To Z 25 Vitamins",
        type: "Tablet",
        front: "atoz25-front.jpeg",
        back: "atoz25-back.jpeg"
    },
    {
        name: "Fullgobin Capsule",
        type: "Kapsül",
        front: "fullgobin-capsule-front.jpeg",
        back: "fullgobin-capsule-back.jpeg"
    },
    {
        name: "Fullgobin Syrup",
        type: "Şurup",
        front: "fullgobin-syrup-front.jpeg",
        back: "fullgobin-syrup-back.jpeg"
    },
    {
        name: "Life Lytes Orange Zinc + Dextrose",
        type: "Şurup",
        front: "lifelytes-orange-front.jpeg",
        back: "lifelytes-orange-back.jpeg"
    },
    {
        name: "Life Lytes Strawberry Zinc + Dextrose",
        type: "Şurup",
        front: "lifelytes-strawberry-front.jpeg",
        back: "lifelytes-strawberry-back.jpeg"
    },
    {
        name: "More Vit Syrup for Children",
        type: "Şurup",
        front: "morevit-syrup-front.jpeg",
        back: "morevit-syrup-back.jpeg"
    },
    {
        name: "Omevit 3 Soft Capsule",
        type: "Kapsül",
        front: "omevit3-front.jpeg",
        back: "omevit3-back.jpeg"
    },
    {
        name: "Ostium D3 Syrup",
        type: "Şurup",
        front: "ostium-d3-syrup-front.jpeg",
        back: "ostium-d3-syrup-back.jpeg"
    },
    {
        name: "Ostium D3 Tablets",
        type: "Tablet",
        front: "ostium-d3-tablets-front.jpeg",
        back: "ostium-d3-tablets-back.jpeg"
    }
];

function readStoredArray(key) {
    try {
        const value = JSON.parse(
            localStorage.getItem(key) || "[]"
        );

        return Array.isArray(value) ? value : [];
    } catch {
        return [];
    }
}

function initializeCatalog() {
    if (localStorage.getItem(INIT_KEY) === "yes") {
        return;
    }

    const existingCategories = readStoredArray(CATEGORY_KEY);
    const existingProducts = readStoredArray(PRODUCT_KEY);

    // Dört temel kategoriyi mevcut kayıtları bozmadan ekle.
    const allCategories = [...existingCategories];

    defaultCategories.forEach(defaultCategory => {
        const exists = allCategories.some(category =>
            category.name.toLocaleLowerCase("tr-TR") ===
            defaultCategory.name.toLocaleLowerCase("tr-TR")
        );

        if (!exists) {
            allCategories.push({ ...defaultCategory });
        }
    });

    // Daha önce eklenmiş Admin ürünlerini koru.
    const allProducts = [...existingProducts];

    initialProducts.forEach((item, index) => {
        const alreadyExists = allProducts.some(product =>
            String(product.name || "")
                .toLocaleLowerCase("tr-TR") ===
            item.name.toLocaleLowerCase("tr-TR")
        );

        if (alreadyExists) {
            return;
        }

        const category = allCategories.find(
            c => c.name === item.type
        );

        allProducts.push({
            id: "initial-product-" + (index + 1),
            name: item.name,
            sku: "FAM-DEMO-" + String(index + 1).padStart(3, "0"),
            categoryId: category ? category.id : "",
            form: item.type,
            brand: "",
            price: null,
            stock: null,
            description: "",

            // Klasörde mevcut gerçek ön/arka dosyaları.
            frontImageName: item.front,
            backImageName: item.back,

            frontImageData: "",
            backImageData: "",

            updatedAt: "",
            isInitialProduct: true
        });
    });

    try {
        localStorage.setItem(
            CATEGORY_KEY,
            JSON.stringify(allCategories)
        );

        localStorage.setItem(
            PRODUCT_KEY,
            JSON.stringify(allProducts)
        );

        localStorage.setItem(INIT_KEY, "yes");
    } catch (error) {
        console.error("Katalog hazırlanamadı:", error);
    }
}

// Her sayfada güvenle çağrılabilir.
// İlk başarılı çalışmadan sonra tekrar ürün oluşturmaz.
initializeCatalog();

const ProductStore = {
    adminProductsKey: PRODUCT_KEY,
    adminCategoriesKey: CATEGORY_KEY,
    favoritesKey: FAVORITES_KEY,

    categories() {
        return readStoredArray(CATEGORY_KEY);
    },

    // Düzeltildi: Artı işareti kaldırıldı, dosya adı doğrudan döndürülüyor
    image(filename) {
        return filename; 
    },

    resolveImage(source) {
        const fallback = "product-placeholder.svg";

        if (!source) return fallback;

        if (source.startsWith("data:image/") || source.startsWith("http")) {
            return source;
        }

        // Dosyalar ana klasörde olduğu için doğrudan dosya adını (örn: atoz25-front.jpeg) döndürüyoruz
        return source;
    },

    all() {
        const categories = this.categories();
        const savedProducts = readStoredArray(PRODUCT_KEY);

        return savedProducts.map(product => {
            const category = categories.find(
                c => c.id === product.categoryId
            );

            const priceIsMissing =
                product.price === null ||
                product.price === undefined ||
                product.price === "";

            const stockIsMissing =
                product.stock === null ||
                product.stock === undefined ||
                product.stock === "";

            return {
                id: String(product.id),
                name: product.name,
                sku: product.sku || "",
                brand: product.brand || "",

                type: product.form || "Diğer",

                categoryName: category
                    ? category.name
                    : "Kategorisiz",

                price: priceIsMissing
                    ? null
                    : Number(product.price),

                stock: stockIsMissing
                    ? null
                    : Number(product.stock),

                description: product.description || "",

                front: product.frontImageData ||
                    product.frontImageName ||
                    product.imageName || "",

                back: product.backImageData ||
                    product.backImageName || "",

                updatedAt: product.updatedAt || ""
            };
        }).sort((a, b) =>
            b.updatedAt.localeCompare(a.updatedAt)
        );
    },

    getById(id) {
        return this.all().find(
            product => product.id === String(id)
        );
    },

    detailUrl(id) {
        return "product-detail.html?id=" +
            encodeURIComponent(id);
    },

    formatPrice(price) {
        if (price === null ||
            price === undefined ||
            price === "" ||
            !Number.isFinite(Number(price))) {
            return "Fiyat henüz eklenmedi";
        }

        return Number(price).toLocaleString("tr-TR", {
            style: "currency",
            currency: "TRY"
        });
    },

    getFavorites() {
        return readStoredArray(FAVORITES_KEY)
            .map(String);
    },

    isFavorite(id) {
        return this.getFavorites().includes(String(id));
    },

    toggleFavorite(id) {
        const key = String(id);
        const favorites = this.getFavorites();

        const updated = favorites.includes(key)
            ? favorites.filter(value => value !== key)
            : [...favorites, key];

        try {
            localStorage.setItem(
                FAVORITES_KEY,
                JSON.stringify(updated)
            );
        } catch {
            return this.isFavorite(key);
        }

        return updated.includes(key);
    }
};
