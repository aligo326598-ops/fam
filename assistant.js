
"use strict";

/*
 FAM PHARMA TURKEY - ÜRÜN ASİSTANI

 Mevcut sürüm:
 - Katalog içinde ürün arama
 - İçeriğe göre ürün bulma
 - Fiyat ve stok bilgisi gösterme
 - Ürün detayına yönlendirme
 - Hazır öneri soruları

 Gerçek AI API bağlantısı henüz yok.
*/

(() => {
    if (document.getElementById("famAssistantRoot")) {
        return;
    }

    const root = document.createElement("div");
    root.id = "famAssistantRoot";
    root.className = "fam-assistant";

    const launcher = document.createElement("button");
    launcher.type = "button";
    launcher.className = "fam-assistant-launcher";
    launcher.setAttribute("aria-label", "Ürün asistanını aç");
    launcher.setAttribute("aria-expanded", "false");
    launcher.textContent = "✦";

    const panel = document.createElement("section");
    panel.className = "fam-assistant-panel";
    panel.hidden = true;
    panel.setAttribute("aria-label", "FAM Ürün Asistanı");

    const header = document.createElement("div");
    header.className = "fam-assistant-header";

    const headerInfo = document.createElement("div");
    headerInfo.className = "fam-assistant-header-info";

    const headerIcon = document.createElement("span");
    headerIcon.className = "fam-assistant-header-icon";
    headerIcon.textContent = "✦";

    const headerText = document.createElement("div");

    const heading = document.createElement("strong");
    heading.textContent = "FAM Ürün Asistanı";

    const subtitle = document.createElement("small");
    subtitle.textContent = "Ürün kataloğu yardımcısı";

    headerText.append(heading, subtitle);
    headerInfo.append(headerIcon, headerText);

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "fam-assistant-close";
    closeButton.setAttribute("aria-label", "Sohbeti kapat");
    closeButton.textContent = "×";

    header.append(headerInfo, closeButton);

    const messages = document.createElement("div");
    messages.className = "fam-assistant-messages";
    messages.setAttribute("role", "log");
    messages.setAttribute("aria-live", "polite");
    messages.setAttribute("aria-relevant", "additions");

    const suggestions = document.createElement("div");
    suggestions.className = "fam-assistant-suggestions";

    const form = document.createElement("form");
    form.className = "fam-assistant-form";

    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 300;
    input.required = true;
    input.placeholder = "Ürün hakkında soru sorun...";
    input.setAttribute("aria-label", "Mesajınız");

    const sendButton = document.createElement("button");
    sendButton.type = "submit";
    sendButton.textContent = "Gönder";

    form.append(input, sendButton);

    const footerNote = document.createElement("p");
    footerNote.className = "fam-assistant-note";
    footerNote.textContent =
        "Bilgiler ürün kataloğuna dayanır. " +
        "Tıbbi tavsiye veya teşhis verilmez.";

    panel.append(
        header,
        messages,
        suggestions,
        form,
        footerNote
    );

    root.append(panel, launcher);
    document.body.appendChild(root);

    let initialized = false;

    // ==========================================
    // PENCERE YÖNETİMİ
    // ==========================================

    function openAssistant() {
        panel.hidden = false;
        launcher.setAttribute("aria-expanded", "true");

        if (!initialized) {
            initialized = true;

            addMessage(
                "Merhaba! FAM Pharma Turkey ürünleri hakkında " +
                "bilgi almak ister misiniz? Ürün adı, içeriği, " +
                "fiyatı veya stok durumu hakkında sorabilirsiniz.",
                "assistant"
            );

            renderSuggestions();
        }

        input.focus();
    }

    function closeAssistant() {
        panel.hidden = true;
        launcher.setAttribute("aria-expanded", "false");
        launcher.focus();
    }

    launcher.addEventListener("click", () => {
        if (panel.hidden) {
            openAssistant();
        } else {
            closeAssistant();
        }
    });

    closeButton.addEventListener("click", closeAssistant);

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !panel.hidden) {
            closeAssistant();
        }
    });

    // ==========================================
    // MESAJ EKLEME
    // ==========================================

    function addMessage(text, sender) {
        const message = document.createElement("div");

        message.className =
            "fam-assistant-message " +
            (sender === "user"
                ? "fam-assistant-user"
                : "fam-assistant-bot");

        message.textContent = text;

        messages.appendChild(message);
        scrollToBottom();

        return message;
    }

    function scrollToBottom() {
        messages.scrollTop = messages.scrollHeight;
    }

    // ==========================================
    // YAZI NORMALLEŞTİRME
    // ==========================================

    function normalize(value) {
        return String(value || "")
            .toLocaleLowerCase("tr-TR")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/ı/g, "i")
            .replace(/[^a-z0-9]+/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    const STOP_WORDS = new Set([
        "hangi", "var", "mi", "mı", "mu", "mü",
        "urun", "urunler", "urunleri", "urunleriniz",
        "bana", "bir", "icin", "ile", "ve",
        "nedir", "neler", "hakkinda", "bilgi",
        "ver", "goster", "istiyorum", "siz", "sizde",
        "olan", "iceren", "iceriyor", "bulunur",
        "fiyat", "fiyati", "fiyatlari", "stok",
        "stokta", "kac", "ne", "kadar"
    ]);

    function tokenize(value) {
        return normalize(value)
            .split(" ")
            .filter(word =>
                word.length > 1 &&
                !STOP_WORDS.has(word)
            );
    }

    // ==========================================
    // KATALOG
    // ==========================================

    function getProducts() {
        if (
            typeof ProductStore === "undefined" ||
            typeof ProductStore.all !== "function"
        ) {
            return [];
        }

        try {
            return ProductStore.all();
        } catch (error) {
            console.error(
                "Asistan ürünleri okuyamadı:",
                error
            );
            return [];
        }
    }

    function searchProducts(question) {
        const tokens = tokenize(question);
        const query = normalize(question);

        if (!tokens.length) return [];

        return getProducts()
            .map(product => {
                const name = normalize(product.name);
                const description = normalize(
                    product.description
                );
                const category = normalize(
                    product.categoryName || product.category
                );
                const form = normalize(
                    product.type || product.form
                );
                const brand = normalize(product.brand);

                let score = 0;

                tokens.forEach(token => {
                    if (name.includes(token)) {
                        score += 5;
                    }

                    if (brand.includes(token)) {
                        score += 3;
                    }

                    if (description.includes(token)) {
                        score += 2;
                    }

                    if (category.includes(token)) {
                        score += 2;
                    }

                    if (form.includes(token)) {
                        score += 2;
                    }
                });

                if (query && name === query) {
                    score += 20;
                }

                return { product, score };
            })
            .filter(result => result.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 4)
            .map(result => result.product);
    }

    function getPrice(product) {
        if (
            product.price === null ||
            product.price === undefined ||
            product.price === ""
        ) {
            return "Fiyat belirtilmemiş";
        }

        const price = Number(product.price);

        if (!Number.isFinite(price)) {
            return "Fiyat belirtilmemiş";
        }

        return price.toLocaleString("tr-TR", {
            style: "currency",
            currency: "TRY"
        });
    }

    function getStock(product) {
        if (
            product.stock === null ||
            product.stock === undefined ||
            product.stock === ""
        ) {
            return "Stok bilgisi belirtilmemiş";
        }

        const stock = Number(product.stock);

        if (!Number.isFinite(stock)) {
            return "Stok bilgisi belirtilmemiş";
        }

        return stock > 0
            ? "Stokta mevcut: " + stock + " adet"
            : "Stokta yok";
    }

    // ==========================================
    // ÜRÜN KARTI
    // ==========================================

    function addProductCard(product) {
        const card = document.createElement("a");
        card.className = "fam-assistant-product";

        card.href =
            typeof ProductStore.detailUrl === "function"
                ? ProductStore.detailUrl(product.id)
                : "product-detail.html?id=" +
                    encodeURIComponent(product.id);

        const image = document.createElement("img");

        image.alt = product.name;
        image.loading = "lazy";

        image.src =
            typeof ProductStore.resolveImage === "function"
                ? ProductStore.resolveImage(
                    product.front ||
                    product.frontImageData ||
                    ""
                )
                : "images/ui/product-placeholder.svg";

        image.onerror = () => {
            image.onerror = null;
            image.src = "images/ui/product-placeholder.svg";
        };

        const info = document.createElement("div");
        info.className = "fam-assistant-product-info";

        const name = document.createElement("strong");
        name.textContent = product.name;

        const price = document.createElement("small");
        price.textContent = getPrice(product);

        const stock = document.createElement("small");
        stock.textContent = getStock(product);

        const linkText = document.createElement("span");
        linkText.textContent = "Ürünü İncele →";

        info.append(name, price, stock, linkText);
        card.append(image, info);
        messages.appendChild(card);

        scrollToBottom();
    }

    // ==========================================
    // GÜVENLİ YANITLAR
    // ==========================================

    function isMedicalQuestion(question) {
        const words = normalize(question);

        return [
            "hastalik",
            "tedavi",
            "ilac yerine",
            "tani koy",
            "doz oner",
            "kac tablet kullan",
            "kac kapsul kullan",
            "hamileyim",
            "yan etki",
            "recete",
            "doktor yerine"
        ].some(term => words.includes(term));
    }

    function isGreeting(question) {
        const words = normalize(question);

        return [
            "merhaba",
            "selam",
            "iyi gunler",
            "hey"
        ].includes(words);
    }

    function answerQuestion(question) {
        if (isMedicalQuestion(question)) {
            addMessage(
                "Hastalık teşhisi, tedavi veya kişiye özel " +
                "doz önerisi veremem. Bu konularda doktorunuza " +
                "veya eczacınıza danışın. Dilerseniz ürünlerin " +
                "ambalajında belirtilen içerikleri incelemenize " +
                "yardımcı olabilirim.",
                "assistant"
            );
            return;
        }

        if (isGreeting(question)) {
            addMessage(
                "Merhaba! Ürün adı veya bir içerik " +
                "yazarak katalogda arama yapabilirsiniz. " +
                "Örneğin: Omega 3, D3 veya Fullglobin.",
                "assistant"
            );
            return;
        }

        const products = getProducts();

        if (!products.length) {
            addMessage(
                "Şu anda katalogda görüntülenebilen ürün " +
                "bulunmuyor. Lütfen daha sonra tekrar deneyin.",
                "assistant"
            );
            return;
        }

        const normalized = normalize(question);

        if (
            normalized.includes("tum urun") ||
            normalized.includes("butun urun")
        ) {
            addMessage(
                "Katalogdaki ürünlerin tamamını Ürünler " +
                "sayfasından inceleyebilirsiniz.",
                "assistant"
            );

            const link = document.createElement("a");
            link.className = "fam-assistant-page-link";
            link.href = "products.html";
            link.textContent = "Tüm Ürünleri Gör →";

            messages.appendChild(link);
            scrollToBottom();

            return;
        }

        const matches = searchProducts(question);

        if (!matches.length) {
            addMessage(
                "Bu ifadeyle eşleşen bir ürün bulamadım. " +
                "Ürün adı veya ambalaj içeriğindeki bir " +
                "kelimeyle tekrar arayabilirsiniz.",
                "assistant"
            );
            return;
        }

        addMessage(
            matches.length === 1
                ? "Katalogda eşleşen ürünü buldum:"
                : "Katalogda sorunuzla eşleşen ürünler:",
            "assistant"
        );

        matches.forEach(addProductCard);

        addMessage(
            "Detaylı içerik ve ambalaj bilgileri için " +
            "ürünün detay sayfasını inceleyebilirsiniz.",
            "assistant"
        );
    }

    // ==========================================
    // HAZIR SORULAR
    // ==========================================

    function renderSuggestions() {
        const questions = [
            "Omega 3",
            "D3",
            "Fullglobin",
            "Tüm ürünler"
        ];

        suggestions.replaceChildren();

        questions.forEach(question => {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = question;

            button.addEventListener("click", () => {
                submitQuestion(question);
            });

            suggestions.appendChild(button);
        });
    }

    // ==========================================
    // MESAJ GÖNDERME
    // ==========================================

    function submitQuestion(value) {
        const question = String(value || "").trim();

        if (!question) return;

        addMessage(question, "user");

        try {
            answerQuestion(question);
        } catch (error) {
            console.error("Asistan yanıt hatası:", error);

            addMessage(
                "İşlem sırasında bir sorun oluştu. " +
                "Lütfen tekrar deneyin.",
                "assistant"
            );
        }

        input.value = "";
        input.focus();
    }

    form.addEventListener("submit", event => {
        event.preventDefault();
        submitQuestion(input.value);
    });

})();
