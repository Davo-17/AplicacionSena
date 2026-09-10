/* =========================================================
   LOGIN SENA
========================================================= */


/* =========================================================
   CREDENCIALES DE DEMOSTRACIÓN
========================================================= */

const ADMIN_USER = "admin";
const ADMIN_PASSWORD = "sena2026";


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

usernameInput.addEventListener("input", clearError);

passwordInput.addEventListener("input", clearError);


function clearError() {

    errorMessage.classList.remove("show");

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


    /* Limpiar error */

    errorMessage.classList.remove("show");


    /* Activar carga */

    loginButton.disabled = true;

    loginButton.classList.add("loading");

    buttonText.textContent =
        "Verificando credenciales...";


    /*
        Simulamos una pequeña espera
        para mantener la animación
    */

    setTimeout(() => {

        if (
            username === ADMIN_USER &&
            password === ADMIN_PASSWORD
        ) {

            loginCorrecto();

        } else {

            loginIncorrecto();

        }

    }, 800);

});


/* =========================================================
   LOGIN CORRECTO
========================================================= */

function loginCorrecto() {

    loginCard.style.display = "none";

    successMessage.classList.add("show");


    /*
        Aquí puedes poner la página
        a la que quieres enviar al usuario.
    */

    setTimeout(() => {

        /*
            EJEMPLO:

            window.location.href =
                "admin.html";
        */

        console.log(
            "Login correcto. Redirigir al panel."
        );

    }, 900);

}


/* =========================================================
   LOGIN INCORRECTO
========================================================= */

function loginIncorrecto() {

    loginButton.disabled = false;

    loginButton.classList.remove("loading");

    buttonText.textContent =
        "Ingresar al panel";

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