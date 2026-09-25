/* =========================================================
   LOGIN SENA
========================================================= */


/* =========================================================
   URL DEL BACKEND (FastAPI)
   - Si login.html se sirve desde el backend (puerto 8000),
     usa el mismo origen. Si no, usa localhost:8000.
========================================================= */

const API_URL =
    location.origin.includes(":8000")
        ? location.origin + "/api/v1"
        : "http://127.0.0.1:8000/api/v1";


/* =========================================================
   ELEMENTOS
========================================================= */

const loginForm = document.getElementById("loginForm");

const usernameInput =
    document.getElementById("username");

const passwordInput =
    document.getElementById("password");

const togglePassword =
    document.getElementById("togglePassword");

const loginButton =
    document.getElementById("loginButton");

const buttonText =
    document.getElementById("buttonText");

const loader =
    document.getElementById("loader");

const errorMessage =
    document.getElementById("errorMessage");

const loginCard =
    document.getElementById("loginCard");

const successMessage =
    document.getElementById("successMessage");

const typewriter =
    document.getElementById("typewriter");


/* =========================================================
   MOSTRAR / OCULTAR CONTRASEÑA
========================================================= */

togglePassword.addEventListener("click", () => {

    if (passwordInput.type === "password") {

        passwordInput.type = "text";

        togglePassword.textContent = "🙈";

    } else {

        passwordInput.type = "password";

        togglePassword.textContent = "👁";

    }

});


/* =========================================================
   QUITAR ERROR AL ESCRIBIR
========================================================= */

/* Dominios institucionales permitidos (igual que el backend). */
const DOMINIOS_PERMITIDOS = ["soy.sena.edu.co", "sena.edu.co"];

const betowaNotice =
    document.getElementById("betowaNotice");


function esCorreoInstitucional(correo) {

    const limpio = correo.trim().toLowerCase();

    return DOMINIOS_PERMITIDOS.some((d) => limpio.endsWith("@" + d));

}


function mostrarAvisoBetowa() {

    errorMessage.classList.remove("show");

    if (betowaNotice) betowaNotice.hidden = false;

}


function ocultarAvisoBetowa() {

    if (betowaNotice) betowaNotice.hidden = true;

}


const errorTexto =
    errorMessage.querySelector("p");

const ERROR_DEFECTO =
    "Correo o contraseña incorrectos.";


function mostrarAvisoLimite() {

    if (errorTexto) {

        errorTexto.textContent =
            "Demasiados intentos. Espera 1 minuto e intenta una sola vez.";

    }

    errorMessage.classList.add("show");

    ocultarAvisoBetowa();

}


usernameInput.addEventListener("input", () => {
    clearError();
    ocultarAvisoBetowa();
});

passwordInput.addEventListener("input", clearError);


function clearError() {

    errorMessage.classList.remove("show");

    if (errorTexto) errorTexto.textContent = ERROR_DEFECTO;

}


/* =========================================================
   LOGIN
========================================================= */

loginForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const username =
        usernameInput.value.trim();

    const password =
        passwordInput.value;


    /* Limpiar errores */

    errorMessage.classList.remove("show");

    ocultarAvisoBetowa();


    /* Solo correos institucionales: el resto va a Betowa */

    if (!esCorreoInstitucional(username)) {

        mostrarAvisoBetowa();

        return;

    }


    /* Activar carga */

    loginButton.disabled = true;

    loginButton.classList.add("loading");

    buttonText.textContent =
        "Verificando credenciales...";


    /*
        Login real contra el backend FastAPI.
        El campo "usuario" se envía como email,
        que es lo que espera POST /api/v1/auth/login.
    */

    fetch(API_URL + "/auth/login", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            email: username,
            password: password
        })

    })
    .then((res) => {

        // 422 = dominio no institucional (lo frena el backend).
        if (res.status === 422) {
            mostrarAvisoBetowa();
            throw new Error("dominio no permitido");
        }

        // 429 = demasiados intentos (límite 5/min por IP). Hay que esperar.
        if (res.status === 429) {
            mostrarAvisoLimite();
            throw new Error("límite de intentos");
        }

        if (!res.ok) {
            throw new Error("credenciales inválidas");
        }

        return res.json();

    })
    .then((data) => {

        /*
            Cuenta exenta: entra directo solo con la contraseña.
            Las demás pasan al segundo paso con código al correo y el
            token se guarda solo después de verificarlo.
        */
        if (data.requiere_codigo === false) {
            localStorage.setItem(
                "access_token",
                data.access_token
            );
            loginCorrecto();
        } else {
            iniciarVerificacion(username, data.access_token);
        }

    })
    .catch((err) => {

        console.error(err);

        loginIncorrecto();

    });

});


/* =========================================================
   LOGIN CORRECTO
========================================================= */

function loginCorrecto() {

    loginCard.style.display = "none";

    successMessage.classList.add("show");


    /*
        Ya hay token guardado: preguntamos quién es
        y el sistema decide a dónde llevarlo.
        El usuario nunca elige ni ve si es admin o no.
    */

    const token =
        localStorage.getItem("access_token");

    fetch(API_URL + "/auth/yo", {

        headers: {
            "Authorization": "Bearer " + token
        }

    })
    .then((res) => res.json())
    .then((yo) => {

        if (
            yo &&
            yo.rol === "administrador"
        ) {
            window.location.href = "/admin/";
        } else {
            window.location.href = "index.html";
        }

    })
    .catch(() => {

        window.location.href = "index.html";

    });

}


/* =========================================================
   LOGIN INCORRECTO
========================================================= */

function loginIncorrecto() {

    loginButton.disabled = false;

    loginButton.classList.remove("loading");

    buttonText.textContent =
        "Ingresar";

    // Si ya mostramos el aviso de Betowa, no sumamos el error genérico.
    if (betowaNotice && !betowaNotice.hidden) {
        return;
    }

    errorMessage.classList.add("show");

    passwordInput.value = "";

    passwordInput.focus();

}


/* =========================================================
   TEXTO ANIMADO
========================================================= */

const texts = [

    "Gestión de programas",
    "Control académico",
    "Oferta formativa",
    "Panel administrativo"

];


let textIndex = 0;

let characterIndex = 0;

let deleting = false;


function typeWriter() {

    const currentText =
        texts[textIndex];


    if (!deleting) {

        typewriter.textContent =
            currentText.substring(
                0,
                characterIndex
            );

        characterIndex++;


        if (
            characterIndex >
            currentText.length
        ) {

            deleting = true;

            setTimeout(
                typeWriter,
                1800
            );

            return;
        }


        setTimeout(
            typeWriter,
            60
        );

    } else {

        typewriter.textContent =
            currentText.substring(
                0,
                characterIndex
            );

        characterIndex--;


        if (characterIndex < 0) {

            deleting = false;

            characterIndex = 0;

            textIndex++;

            if (
                textIndex >= texts.length
            ) {

                textIndex = 0;

            }

            setTimeout(
                typeWriter,
                300
            );

            return;
        }


        setTimeout(
            typeWriter,
            30
        );

    }

}


typeWriter();


/* =========================================================
   PARTICULAS DEL FONDO
========================================================= */

const canvas =
    document.getElementById("particles");

const ctx =
    canvas.getContext("2d");


let particles = [];


function resizeCanvas() {

    canvas.width =
        canvas.offsetWidth;

    canvas.height =
        canvas.offsetHeight;

}


resizeCanvas();

window.addEventListener(
    "resize",
    resizeCanvas
);


/* =========================================================
   CREAR PARTICULAS
========================================================= */

function createParticles() {

    particles = [];

    for (
        let i = 0;
        i < 35;
        i++
    ) {

        particles.push({

            x:
                Math.random() *
                canvas.width,

            y:
                Math.random() *
                canvas.height,

            radius:
                Math.random() *
                4 +
                2,

            speedX:
                (Math.random() - .5)
                * .25,

            speedY:
                (Math.random() - .5)
                * .25,

            opacity:
                Math.random() *
                .25 +
                .05,

            type:
                Math.floor(
                    Math.random() * 3
                )

        });

    }

}


createParticles();


/* =========================================================
   DIBUJAR TRIANGULO
========================================================= */

function drawTriangle(
    x,
    y,
    r
) {

    ctx.beginPath();

    ctx.moveTo(
        x,
        y - r
    );

    ctx.lineTo(
        x - r,
        y + r
    );

    ctx.lineTo(
        x + r,
        y + r
    );

    ctx.closePath();

}


/* =========================================================
   DIBUJAR HEXAGONO
========================================================= */

function drawHexagon(
    x,
    y,
    r
) {

    ctx.beginPath();

    for (
        let i = 0;
        i < 6;
        i++
    ) {

        const angle =
            (Math.PI * 2 / 6) * i;

        const px =
            x +
            r *
            Math.cos(angle);

        const py =
            y +
            r *
            Math.sin(angle);


        if (i === 0) {

            ctx.moveTo(px, py);

        } else {

            ctx.lineTo(px, py);

        }

    }

    ctx.closePath();

}


/* =========================================================
   ANIMACION PARTICULAS
========================================================= */

function animateParticles() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    particles.forEach(particle => {

        particle.x +=
            particle.speedX;

        particle.y +=
            particle.speedY;


        /* Reaparecer */

        if (
            particle.x <
            -10
        ) {

            particle.x =
                canvas.width + 10;

        }


        if (
            particle.x >
            canvas.width + 10
        ) {

            particle.x = -10;

        }


        if (
            particle.y <
            -10
        ) {

            particle.y =
                canvas.height + 10;

        }


        if (
            particle.y >
            canvas.height + 10
        ) {

            particle.y = -10;

        }


        ctx.globalAlpha =
            particle.opacity;

        ctx.strokeStyle =
            "#ffffff";

        ctx.lineWidth = 1;


        /* Circulo */

        if (
            particle.type === 0
        ) {

            ctx.beginPath();

            ctx.arc(
                particle.x,
                particle.y,
                particle.radius,
                0,
                Math.PI * 2
            );

            ctx.stroke();

        }


        /* Hexagono */

        else if (
            particle.type === 1
        ) {

            drawHexagon(
                particle.x,
                particle.y,
                particle.radius
            );

            ctx.stroke();

        }


        /* Triangulo */

        else {

            drawTriangle(
                particle.x,
                particle.y,
                particle.radius
            );

            ctx.stroke();

        }

    });


    ctx.globalAlpha = 1;


    requestAnimationFrame(
        animateParticles
    );

}


animateParticles();


/* =========================================================
   LOGO ARRASTRABLE (mouse + dedo, Pointer Events)
   - Se mueve solo sobre el panel izquierdo, sin salirse.
   - Doble clic / doble toque lo devuelve a su sitio.
   - Desactivado si el usuario prefiere movimiento reducido.
========================================================= */

(function logoArrastrable() {

    const logo =
        document.querySelector(".logo-wrapper");

    if (!logo) return;

    if (
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) return;

    let x = 0;
    let y = 0;
    let inicioX = 0;
    let inicioY = 0;
    let arrastrando = false;

    function limitar(valor, min, max) {
        return Math.min(Math.max(valor, min), max);
    }

    // Evita el arrastre fantasma nativo de la imagen.
    logo.querySelectorAll("img").forEach((img) => {
        img.draggable = false;
    });

    logo.addEventListener("pointerdown", (event) => {

        arrastrando = true;

        logo.style.transition = "none";

        inicioX = event.clientX - x;
        inicioY = event.clientY - y;

        logo.classList.add("dragging");

        logo.setPointerCapture(event.pointerId);

    });

    logo.addEventListener("pointermove", (event) => {

        if (!arrastrando) return;

        const panel = logo.closest(".left-panel");

        let nx = event.clientX - inicioX;
        let ny = event.clientY - inicioY;

        if (panel) {

            const p = panel.getBoundingClientRect();

            const r = logo.getBoundingClientRect();

            // Origen sin transformar, para confinar dentro del panel.
            const baseX = r.left - x;
            const baseY = r.top - y;

            nx = limitar(nx, p.left - baseX + 8, p.right - baseX - r.width - 8);
            ny = limitar(ny, p.top - baseY + 8, p.bottom - baseY - r.height - 8);

        }

        x = nx;
        y = ny;

        logo.style.transform =
            "translate(" + x + "px," + y + "px)";

    });

    function terminar() {

        arrastrando = false;

        logo.classList.remove("dragging");

    }

    logo.addEventListener("pointerup", terminar);

    logo.addEventListener("pointercancel", terminar);

    // Doble clic / doble toque: vuelve al centro con animación.
    logo.addEventListener("dblclick", () => {

        x = 0;
        y = 0;

        logo.style.transition = "transform .35s ease";

        logo.style.transform = "translate(0px, 0px)";

    });

})();





/* =========================================================
   SEGUNDO PASO: código de verificación (estilo apps reales)
   - Contraseña OK -> se envía código de 6 dígitos al correo.
   - Anuncio con temporizador de 3 minutos para escribirlo.
   - El token se guarda solo después de verificar el código.
========================================================= */

const TIEMPO_CODIGO = 180;

let correoPendiente = "";
let tokenPendiente = "";
let segundosRestantes = 0;
let intervaloTimer = null;


function pintarTimer() {
    const el = document.getElementById("verifyTimer");
    if (!el) return;
    const m = Math.floor(segundosRestantes / 60);
    const s = segundosRestantes % 60;
    el.textContent = m + ":" + String(s).padStart(2, "0");
    el.classList.toggle("agotado", segundosRestantes <= 0);
}

function detenerTimer() {
    if (intervaloTimer) {
        clearInterval(intervaloTimer);
        intervaloTimer = null;
    }
}

function iniciarTimer() {
    detenerTimer();
    segundosRestantes = TIEMPO_CODIGO;
    pintarTimer();
    intervaloTimer = setInterval(() => {
        segundosRestantes--;
        if (segundosRestantes <= 0) {
            segundosRestantes = 0;
            detenerTimer();
            const p = document.querySelector("#verifyError p");
            if (p) p.textContent = "El tiempo se agotó. Pide un código nuevo con Reenviar.";
            document.getElementById("verifyError").classList.add("show");
        }
        pintarTimer();
    }, 1000);
}

function mostrarPasoCodigo(correo) {
    document.getElementById("loginForm").hidden = true;
    document.getElementById("verifyForm").hidden = false;
    document.getElementById("verifyEmail").textContent = correo;
    document.getElementById("verifyCode").value = "";
    document.getElementById("verifyError").classList.remove("show");
    iniciarTimer();
    document.getElementById("verifyCode").focus();
}

function volverAlLogin() {
    detenerTimer();
    correoPendiente = "";
    tokenPendiente = "";
    document.getElementById("verifyForm").hidden = true;
    document.getElementById("loginForm").hidden = false;
    loginButton.disabled = false;
    loginButton.classList.remove("loading");
    buttonText.textContent = "Ingresar";
    passwordInput.value = "";
    usernameInput.focus();
}


/* Contraseña verificada: pedimos el código y mostramos el anuncio. */
async function iniciarVerificacion(correo, token) {
    correoPendiente = correo;
    tokenPendiente = token;
    buttonText.textContent = "Enviando código...";
    try {
        const res = await fetch(API_URL + "/auth/otp/solicitar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: correo })
        });
        if (!res.ok) {
            const datos = await res.json().catch(() => ({}));
            throw new Error(datos.detail || "No se pudo enviar el código. Inténtalo de nuevo.");
        }
        mostrarPasoCodigo(correo);
    } catch (err) {
        console.error(err);
        if (errorTexto) errorTexto.textContent = err.message || ERROR_DEFECTO;
        errorMessage.classList.add("show");
    } finally {
        loginButton.disabled = false;
        loginButton.classList.remove("loading");
        buttonText.textContent = "Ingresar";
    }
}


/* Verificar el código: recién ahí se guarda el token y se entra. */
document.getElementById("verifyForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const caja = document.getElementById("verifyError");
    const texto = caja.querySelector("p");
    caja.classList.remove("show");
    const codigo = document.getElementById("verifyCode").value.trim();
    if (!/^\d{6}$/.test(codigo)) {
        if (texto) texto.textContent = "Escribe los 6 dígitos del código.";
        caja.classList.add("show");
        return;
    }
    if (segundosRestantes <= 0) {
        if (texto) texto.textContent = "El tiempo se agotó. Pide un código nuevo con Reenviar.";
        caja.classList.add("show");
        return;
    }
    const btn = document.getElementById("verifyButton");
    const btnTxt = document.getElementById("verifyButtonText");
    btn.disabled = true;
    btnTxt.textContent = "Verificando...";
    try {
        const res = await fetch(API_URL + "/auth/otp/verificar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: correoPendiente, codigo: codigo })
        });
        if (res.status === 429) throw new Error("Demasiados intentos. Espera e inténtalo de nuevo.");
        const datos = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(datos.detail || "Código incorrecto. Revísalo e inténtalo de nuevo.");
        detenerTimer();
        localStorage.setItem("access_token", datos.access_token || tokenPendiente);
        loginCorrecto();
    } catch (err) {
        console.error(err);
        if (texto) texto.textContent = err.message || "No se pudo verificar. Inténtalo de nuevo.";
        caja.classList.add("show");
        document.getElementById("verifyCode").focus();
    } finally {
        btn.disabled = false;
        btnTxt.textContent = "Verificar e ingresar";
    }
});


/* Reenviar: pide otro código y reinicia los 3 minutos. */
document.getElementById("verifyResend").addEventListener("click", async () => {
    const btn = document.getElementById("verifyResend");
    btn.disabled = true;
    try {
        const res = await fetch(API_URL + "/auth/otp/solicitar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: correoPendiente })
        });
        if (!res.ok) {
            const datos = await res.json().catch(() => ({}));
            throw new Error(datos.detail || "No se pudo reenviar. Inténtalo de nuevo.");
        }
        document.getElementById("verifyError").classList.remove("show");
        document.getElementById("verifyCode").value = "";
        iniciarTimer();
        document.getElementById("verifyCode").focus();
    } catch (err) {
        console.error(err);
        const caja = document.getElementById("verifyError");
        const texto = caja.querySelector("p");
        if (texto) texto.textContent = err.message || "No se pudo reenviar. Inténtalo de nuevo.";
        caja.classList.add("show");
    } finally {
        btn.disabled = false;
    }
});

document.getElementById("verifyBack").addEventListener("click", volverAlLogin);
