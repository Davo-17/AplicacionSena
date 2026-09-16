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

  function mostrarUsuario(nombre, rol) {
    btnRegister.textContent = "Cerrar sesión";
    btnRegister.onclick = cerrarSesion;
    userName.textContent = nombre || "Usuario";
    userProfile.classList.remove("hidden");
    // Solo el admin ve el acceso al panel. Los demás ni se enteran.
    if (rol === "administrador" && !document.getElementById("btnPanel")) {
      const link = document.createElement("a");
      link.id = "btnPanel";
      link.href = "admin.html";
      link.className = "button button-outline-sm";
      link.textContent = "Panel";
      btnRegister.before(link);
    }
  }

  // Sin sesión: mandamos a la página de login (frontend/login.html),
  // que guarda el token y devuelve aquí. Al volver, el bloque de
  // "Verificar sesión" de abajo lee el token y muestra el perfil.
  function handleLogin() {
    window.location.href = "login.html";
  }

  function mostrarBotonRegistro() {
    btnRegister.textContent = "Ingresar";
    btnRegister.onclick = handleLogin;
    userProfile.classList.add("hidden");
  }

  function cerrarSesion() {
    localStorage.removeItem("access_token");
    document.getElementById("btnPanel")?.remove();
    mostrarBotonRegistro();
  }

  btnRegister.onclick = handleLogin;

  // Si ya había sesión, la recuperamos.
  const tokenGuardado = localStorage.getItem("access_token");
  if (tokenGuardado) {
    pedir(API_URL + "/auth/yo", {
      headers: { Authorization: "Bearer " + tokenGuardado },
    })
      .then((user) => mostrarUsuario(user.nombre || user.email, user.rol))
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

  // ---------- 2b. NOVEDADES (vienen del backend, las publica el admin) ----------
  async function cargarNovedades() {
    const grid = document.getElementById("newsGrid");
    if (!grid) return;
    try {
      const novedades = await pedir(API_URL + "/novedades");
      if (!novedades.length) return; // sin datos: se quedan las fijas del HTML
      grid.innerHTML = novedades.slice(0, 3).map((n) => `
        <article class="news-card">
          <div class="news-image"><img src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80" alt=""><span class="news-tag">${n.etiqueta || "Noticia"}</span></div>
          <div class="news-content"><span class="news-date">${n.fecha || ""}</span><h3>${n.titulo}</h3><p>${n.descripcion || ""}</p></div>
        </article>`).join("");
    } catch (err) {
      console.warn("Novedades offline, muestro las fijas.", err);
    }
  }

  cargarNovedades();

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

  // ---------- 6. CHATBOT (conectado al backend, funciona para todo visitante) ----------
  const chatButton = document.getElementById("chatButton");
  const chatBox = document.getElementById("chatBox");
  const closeChat = document.getElementById("closeChat");
  const chatInput = document.getElementById("chatInput");
  const sendMessage = document.getElementById("sendMessage");
  const chatMessages = document.getElementById("chatMessages");

  // Contenedor de respuestas rápidas (chips). Se crea si el HTML aún no lo trae.
  let quickReplies = document.getElementById("quickReplies");
  if (!quickReplies) {
    quickReplies = document.createElement("div");
    quickReplies.id = "quickReplies";
    quickReplies.className = "quick-replies";
    chatBox?.querySelector(".chat-input")?.before(quickReplies);
  }

  const CHIPS_INICIALES = ["Ver programas", "Inscribirme", "Requisitos", "¿Es gratis?", "Novedades"];
  let enviando = false;

  function abrirChat() {
    chatBox.classList.remove("hidden");
    chatInput?.focus();
  }
  function alternarChat() {
    chatBox.classList.toggle("hidden");
    if (!chatBox.classList.contains("hidden")) chatInput?.focus();
  }
  chatButton.addEventListener("click", alternarChat);
  closeChat.addEventListener("click", () => chatBox.classList.add("hidden"));
  document.getElementById("btnChatearAhora")?.addEventListener("click", abrirChat);

  // Convierte URLs en links clicables y saltos de línea en <br>, sin inyectar HTML.
  function formatearBot(texto) {
    const div = document.createElement("div");
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    let last = 0;
    let match;
    const frag = document.createDocumentFragment();
    while ((match = urlRegex.exec(texto)) !== null) {
      if (match.index > last) frag.appendChild(document.createTextNode(texto.slice(last, match.index)));
      const a = document.createElement("a");
      a.href = match[0];
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = match[0].includes("sofia") ? "Abrir Sofia Plus →" : match[0];
      frag.appendChild(a);
      last = match.index + match[0].length;
    }
    frag.appendChild(document.createTextNode(texto.slice(last)));
    div.appendChild(frag);
    div.innerHTML = div.innerHTML.replace(/\n/g, "<br>");
    return div.innerHTML;
  }

  function pintarChips(lista) {
    if (!quickReplies) return;
    quickReplies.innerHTML = "";
    (lista?.length ? lista : CHIPS_INICIALES).slice(0, 5).forEach((texto) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.textContent = texto;
      b.addEventListener("click", () => {
        chatInput.value = texto;
        enviarMensaje();
      });
      quickReplies.appendChild(b);
    });
  }

  function mostrarEscribiendo() {
    const t = document.createElement("div");
    t.className = "bot-message typing";
    t.id = "typingBubble";
    t.innerHTML = "<span></span><span></span><span></span>";
    chatMessages.appendChild(t);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  function ocultarEscribiendo() {
    document.getElementById("typingBubble")?.remove();
  }

  // Fallback local (misma lógica base del backend) si el servidor no responde.
  // Así el bot NUNCA queda muerto para el usuario.
  function respuestaLocal(texto) {
    const t = texto.toLowerCase();
    if (/hola|buenas|ayuda|menu/.test(t)) return "¡Hola! 👋 Puedo orientarte sobre programas, inscripciones en Sofia Plus, requisitos y costos. ¿Qué te interesa?";
    if (/inscri|sofia|cupo|registr/.test(t)) return "Inscríbete gratis en Sofia Plus: https://oferta.senasofiaplus.edu.co/ Busca el programa y dale a 'Inscribirme'.";
    if (/requisito|documento|edad|papeles/.test(t)) return "Requisitos: mayor de 14 años, documento vigente y certificado de estudios según el programa. Todo gratis.";
    if (/costo|precio|gratis|pago|vale|cuesta/.test(t)) return "Toda la formación del SENA es 100% gratuita. Nadie debe cobrarte.";
    if (/tecnolog|adso|software/.test(t)) return "Tecnologías: ADSO, Gestión Empresarial y Redes. Están en la sección Programas con botón de inscripción.";
    if (/tecnica|tecnico/.test(t)) return "Técnicas: Programación de Software, Sistemas y Contabilización. Míralas en Programas.";
    if (/novedad|noticia|convocatoria|evento/.test(t)) return "Revisa la sección Novedades: convocatoria virtual 2026, bootcamp de IA y feria de empleo.";
    if (/gracias/.test(t)) return "¡Con gusto! 🎓 ¿Te recomiendo un programa según tus gustos?";
    if (/adios|chao|hasta luego/.test(t)) return "¡Éxitos! 🚀 Quedo atento 24/7.";
    return "Puedo ayudarte con programas, inscripciones, requisitos y costos. Prueba: 'quiero estudiar software' o 'cómo me inscribo'.";
  }

  async function enviarMensaje() {
    const texto = chatInput.value.trim();
    if (!texto || enviando) return;
    enviando = true;
    sendMessage.disabled = true;
    agregarBurbuja(texto, "user-message");
    chatInput.value = "";
    quickReplies.innerHTML = "";
    mostrarEscribiendo();
    // Pequeña pausa para que se sienta humano (y da tiempo al backend).
    await new Promise((r) => setTimeout(r, 450));
    try {
      const data = await pedir(API_URL + "/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensaje: texto }),
      });
      ocultarEscribiendo();
      agregarBurbujaHTML(formatearBot(data.respuesta || "Te escucho, ¿me cuentas un poco más?"), "bot-message");
      pintarChips(data.sugerencias);
    } catch (err) {
      console.warn("Chat offline, uso fallback local.", err);
      ocultarEscribiendo();
      agregarBurbuja(respuestaLocal(texto), "bot-message");
      pintarChips(CHIPS_INICIALES);
    } finally {
      enviando = false;
      sendMessage.disabled = false;
      chatInput.focus();
    }
  }

  function agregarBurbuja(texto, clase) {
    const div = document.createElement("div");
    div.className = clase;
    div.textContent = texto;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function agregarBurbujaHTML(html, clase) {
    const div = document.createElement("div");
    div.className = clase;
    div.innerHTML = html;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  sendMessage.addEventListener("click", enviarMensaje);
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviarMensaje();
    }
  });

  pintarChips(CHIPS_INICIALES);

  // ---------- 7. TEMA CLARO/OSCURO (botón icono fijo en el header) ----------
  const themeToggle = document.getElementById("themeToggle");

  function pintarTema() {
    const oscuro = document.body.classList.contains("dark-mode");
    themeToggle?.setAttribute("aria-pressed", String(oscuro));
    themeToggle?.setAttribute("aria-label", oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
  }

  if (localStorage.getItem("theme") === "dark") document.body.classList.add("dark-mode");
  pintarTema();
  themeToggle?.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const oscuro = document.body.classList.contains("dark-mode");
    localStorage.setItem("theme", oscuro ? "dark" : "light");
    pintarTema();
  });

  // Menú hamburguesa: un solo panel con navegación + tema + usuario.
  const menuButton = document.getElementById("menuButton");
  const navPanel = document.getElementById("navPanel");

  function setMenu(abierto) {
    if (!navPanel || !menuButton) return;
    navPanel.classList.toggle("open", abierto);
    menuButton.setAttribute("aria-expanded", String(abierto));
    menuButton.setAttribute("aria-label", abierto ? "Cerrar menú" : "Abrir menú");
  }

  function menuAbierto() {
    return !!navPanel?.classList.contains("open");
  }

  menuButton?.addEventListener("click", (e) => {
    e.stopPropagation();
    setMenu(!menuAbierto());
  });
  // Cierra al elegir un enlace, al pulsar Escape o al tocar fuera del panel.
  navPanel?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenu(false));
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menuAbierto()) {
      setMenu(false);
      menuButton?.focus();
    }
  });
  document.addEventListener("click", (e) => {
    if (menuAbierto() && !navPanel.contains(e.target)) setMenu(false);
  });
});
