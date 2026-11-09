
"use strict";

const resetForm = document.getElementById("resetRequestForm");

resetForm.addEventListener("submit", event => {
    event.preventDefault();

    document.getElementById("resetMessage").textContent =
        "Şifre sıfırlama sistemi henüz aktif değil. " +
        "Backend bağlantısı tamamlandığında bu form " +
        "üzerinden doğrulama bağlantısı istenebilecek.";

    // Bu sürümde bilgiler kaydedilmiyor veya gönderilmiyor.
    resetForm.reset();
});
