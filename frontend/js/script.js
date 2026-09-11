/* App SENA Dajesa - script principal.
 * Código simple a propósito: 1 archivo, funciones cortas, todo en español.
 * Secciones: API, login, programas, filtros, quiz, chat, tema.
 */
document.addEventListener("DOMContentLoaded", () => {
  const API_URL = window.API_URL || "http://127.0.0.1:8000/api/v1";

  // ---------- Utilidad para pedir datos ----------
  async function pedir(url, opciones) {
    const res = await fetch(url, opciones);
    if (!res.ok) throw new Error("Error " + res.status);
    return res.json();
  }

  // ---------- 1. LOGIN ----------
  const btnRegister = document.getElementById("btnRegister");
  const userProfile = document.getElementById("userProfile");
  const userName = document.getElementById("userName");

  function mostrarUsuario(nombre) {
    btnRegister.textContent = "Cerrar sesión";
    btnRegister.onclick = cerrarSesion;
    userName.textContent = nombre || "Usuario";
    userProfile.classList.remove("hidden");
  }

  // Sin sesión: mandamos a la página de login (frontend/login.html),
  // que guarda el token y devuelve aquí. Al volver, el bloque de
  // "Verificar sesión" de abajo lee el token y muestra el perfil.
  function handleLogin() {
    window.location.href = "login.html";
  }

  function mostrarBotonRegistro() {
    btnRegister.textContent = "Registrarse";
    btnRegister.onclick = handleLogin;
    userProfile.classList.add("hidden");
  }

  function cerrarSesion() {
    localStorage.removeItem("access_token");
    mostrarBotonRegistro();
  }

  btnRegister.onclick = handleLogin;

  // Si ya había sesión, la recuperamos.
  const tokenGuardado = localStorage.getItem("access_token");
  if (tokenGuardado) {
    pedir(API_URL + "/auth/yo", {
      headers: { Authorization: "Bearer " + tokenGuardado },
    })
      .then((user) => mostrarUsuario(user.nombre || user.email))
      .catch(() => {
        localStorage.removeItem("access_token");
        mostrarBotonRegistro();
      });
  }

  // ---------- 2. PROGRAMAS (vienen del backend) ----------
  async function cargarProgramas() {
    let programas = [];
    try {
      programas = await pedir(API_URL + "/programas");
    } catch (err) {
      console.warn("Backend no disponible, uso lista vacía.", err);
    }
    const tecnicas = programas.filter((p) => (p.nivel || "").toLowerCase() === "tecnica");
    const tecnologias = programas.filter((p) => (p.nivel || "").toLowerCase() === "tecnologia");
    pintarProgramas(tecnicas.length ? tecnicas : programas.filter((_, i) => i < 3), "tecnicasBody");
    pintarProgramas(tecnologias.length ? tecnologias : programas.filter((_, i) => i >= 3), "tecnologiasBody");
  }

  function pintarProgramas(lista, contenedorId) {
    const contenedor = document.getElementById(contenedorId);
    if (!contenedor) return;
    contenedor.innerHTML = lista
      .map(
        (p) => `
      <div class="program-card" data-modality="${p.modalidad || ""}" data-shift="${p.jornada || ""}">
        <h4>${p.titulo || p.title}</h4>
        <p>${p.descripcion || p.desc || ""}</p>
        <a href="${p.url_sofia || p.url || "#"}" target="_blank" rel="noopener">Inscribirme →</a>
      </div>`
      )
      .join("");
  }

  cargarProgramas();

  // Acordeón de categorías.
  document.querySelectorAll(".category-header").forEach((btn) => {
    btn.addEventListener("click", () => {
      const abierto = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!abierto));
      btn.classList.toggle("active");
      btn.nextElementSibling?.classList.toggle("active");
    });
  });

  // ---------- 3. FILTROS ----------
  const searchInput = document.getElementById("searchInput");
  const modalityFilter = document.getElementById("modalityFilter");
  const shiftFilter = document.getElementById("shiftFilter");

  function filtrarProgramas() {
    const texto = (searchInput?.value || "").toLowerCase().trim();
    const mod = (modalityFilter?.value || "").toLowerCase();
    const jornada = (shiftFilter?.value || "").toLowerCase();
    document.querySelectorAll(".program-card").forEach((card) => {
      const coincideTexto = card.textContent.toLowerCase().includes(texto);
      const coincideMod = !mod || (card.dataset.modality || "").toLowerCase() === mod;
      const coincideShift = !jornada || (card.dataset.shift || "").toLowerCase() === jornada;
      const visible = coincideTexto && coincideMod && coincideShift;
      card.classList.toggle("hidden", !visible);
    });
  }
  searchInput?.addEventListener("input", filtrarProgramas);
  modalityFilter?.addEventListener("change", filtrarProgramas);
  shiftFilter?.addEventListener("change", filtrarProgramas);

  // ---------- 4. CARRUSEL ----------
  const track = document.getElementById("carouselTrack");
  let slide = 0;
  setInterval(() => {
    slide = (slide + 1) % 3;
    if (track) track.style.transform = `translateX(-${slide * 33.333}%)`;
  }, 4000);

  // ---------- 5. QUIZ ----------
  const slides = document.querySelectorAll("#quizSlider .quiz-slide");
  const progressFill = document.getElementById("progressFill");
  const pasos = document.querySelectorAll(".progress-step");
  let pasoActual = 0;

  function pintarQuiz() {
    slides.forEach((s, i) => s.classList.toggle("active", i === pasoActual));
    pasos.forEach((p, i) => p.classList.toggle("active", i <= pasoActual));
    if (progressFill) progressFill.style.width = ((pasoActual + 1) / 3) * 100 + "%";
  }

  document.querySelectorAll(".quiz-next").forEach((b) =>
    b.addEventListener("click", () => {
      if (pasoActual < slides.length - 1) {
        pasoActual++;
        pintarQuiz();
      }
    })
  );
  document.querySelectorAll(".quiz-back").forEach((b) =>
    b.addEventListener("click", () => {
      if (pasoActual > 0) {
        pasoActual--;
        pintarQuiz();
      }
    })
  );

  document.getElementById("recommendButton")?.addEventListener("click", () => {
    const interes = document.querySelector('input[name="interest"]:checked')?.value;
    const nivel = document.querySelector('input[name="level"]:checked')?.value;
    let texto = "Programa recomendado: ";
    if (interes === "technology" && nivel === "technology") texto += "Tecnología en Análisis y Desarrollo de Software (ADSO)";
    else if (interes === "technology") texto += "Técnico en Programación de Software";
    else if (interes === "business") texto += "Tecnología en Gestión Empresarial";
    else texto += "Técnico en Integración de Operaciones Logísticas";
    document.getElementById("recommendation").textContent = texto;
    pasoActual = 3;
    pintarQuiz();
  });
  document.getElementById("restartQuiz")?.addEventListener("click", () => {
    pasoActual = 0;
    pintarQuiz();
  });

  // ---------- 6. CHAT (conectado al backend) ----------
  const chatButton = document.getElementById("chatButton");
  const chatBox = document.getElementById("chatBox");
  const closeChat = document.getElementById("closeChat");
  const chatInput = document.getElementById("chatInput");
  const sendMessage = document.getElementById("sendMessage");
  const chatMessages = document.getElementById("chatMessages");

  function abrirChat() {
    chatBox.classList.remove("hidden");
  }
  chatButton.addEventListener("click", () => chatBox.classList.toggle("hidden"));
  closeChat.addEventListener("click", () => chatBox.classList.add("hidden"));
  document.getElementById("btnChatearAhora")?.addEventListener("click", abrirChat);

  async function enviarMensaje() {
    const texto = chatInput.value.trim();
    if (!texto) return;
    agregarBurbuja(texto, "user-message");
    chatInput.value = "";
    try {
      const data = await pedir(API_URL + "/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensaje: texto }),
      });
      agregarBurbuja(data.respuesta, "bot-message");
    } catch (err) {
      console.warn(err);
      agregarBurbuja("Estoy sin conexión al servidor, pero puedes ver los programas o ir a Sofia Plus.", "bot-message");
    }
  }

  function agregarBurbuja(texto, clase) {
    const div = document.createElement("div");
    div.className = clase;
    div.textContent = texto;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  sendMessage.addEventListener("click", enviarMensaje);
  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") enviarMensaje();
  });

  // ---------- 7. TEMA CLARO/OSCURO ----------
  const themeToggle = document.getElementById("themeToggle");
  if (localStorage.getItem("theme") === "dark") document.body.classList.add("dark-mode");
  themeToggle?.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const oscuro = document.body.classList.contains("dark-mode");
    localStorage.setItem("theme", oscuro ? "dark" : "light");
  });

  // Menú móvil.
  document.getElementById("menuButton")?.addEventListener("click", () => {
    document.getElementById("mainNav")?.classList.toggle("open");
  });
});
