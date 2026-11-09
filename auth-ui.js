"use strict";

/*
 FAM PHARMA TURKEY - AUTH UI

 Backend hazır olduğunda:
 - Giriş Yap / Çıkış Yap değişecek.
*/

async function checkAuthentication() {
    return {
        authenticated: false,
        user: null
    };
}

async function updateAuthMenu() {
    const authButton =
        document.getElementById("authMenuButton");

    if (!authButton) return;

    const session = await checkAuthentication();

    if (session.authenticated) {
        authButton.textContent = "Çıkış Yap";
        authButton.href = "#";

        authButton.onclick = async event => {
            event.preventDefault();

        };
    } else {
        authButton.textContent = "Giriş Yap";
        authButton.href = "login.html";
        authButton.onclick = null;
    }
}

updateAuthMenu();