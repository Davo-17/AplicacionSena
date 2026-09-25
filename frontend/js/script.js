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
  const userMenu = document.getElementById("userMenu");
  const avatarBtn = document.getElementById("avatarBtn");
  const userDropdown = document.getElementById("userDropdown");
  const userName = document.getElementById("userName");
  const userRole = document.getElementById("userRole");
  const btnPanel = document.getElementById("btnPanel");
  const btnLogout = document.getElementById("btnLogout");

  // Con sesión: se muestra solo la foto; el menú se despliega al presionarla.
  function mostrarUsuario(nombre, rol) {
    btnRegister.classList.add("hidden");
    userMenu.classList.remove("hidden");
    userName.textContent = nombre || "Usuario";
    userRole.textContent = rol || "";
    // Solo el admin ve el acceso al panel. Los demás ni se enteran.
    btnPanel.classList.toggle("hidden", rol !== "administrador");
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
    btnRegister.classList.remove("hidden");
    userMenu.classList.add("hidden");
    userDropdown.classList.add("hidden");
    avatarBtn.setAttribute("aria-expanded", "false");
  }

  function cerrarSesion() {
    localStorage.removeItem("access_token");
    mostrarBotonRegistro();
  }

  // Despliegue del menú: clic en la foto, Escape o clic fuera lo cierra.
  function menuUsuarioAbierto() {
    return !userDropdown.classList.contains("hidden");
  }

  function setMenuUsuario(abierto) {
    userDropdown.classList.toggle("hidden", !abierto);
    avatarBtn.setAttribute("aria-expanded", String(abierto));
  }

  btnRegister.onclick = handleLogin;
  btnLogout.addEventListener("click", cerrarSesion);
  avatarBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    setMenuUsuario(!menuUsuarioAbierto());
  });
  document.addEventListener("click", (e) => {
    if (menuUsuarioAbierto() && !userMenu.contains(e.target)) setMenuUsuario(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menuUsuarioAbierto()) {
      setMenuUsuario(false);
      avatarBtn.focus();
    }
  });

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

  function capitalizar(texto) {
    const t = String(texto || "").trim().toLowerCase();
    return t ? t.charAt(0).toUpperCase() + t.slice(1) : "";
  }

  function actualizarConteo(contenedorId, total) {
    const mapa = { tecnicasBody: "tecnicasCount", tecnologiasBody: "tecnologiasCount" };
    const el = document.getElementById(mapa[contenedorId]);
    if (el) el.textContent = total + (total === 1 ? " programa" : " programas");
  }

  function pintarProgramas(lista, contenedorId) {
    const contenedor = document.getElementById(contenedorId);
    if (!contenedor) return;
    actualizarConteo(contenedorId, lista.length);
    if (!lista.length) {
      contenedor.innerHTML = '<div class="program-empty">No hay programas aquí por ahora. Explora la otra modalidad.</div>';
      return;
    }
    contenedor.innerHTML = lista
      .map(
        (p) => {
          const modalidad = capitalizar(p.modalidad);
          const jornada = capitalizar(p.jornada);
          const pills =
            (modalidad ? `<span class="meta-pill">${modalidad}</span>` : "") +
            (jornada ? `<span class="meta-pill">${jornada}</span>` : "");
          return `
      <div class="program-card" data-modality="${p.modalidad || ""}" data-shift="${p.jornada || ""}">
        <div class="program-meta">${pills}</div>
        <h4>${p.titulo || p.title}</h4>
        <p>${p.descripcion || p.desc || ""}</p>
        <a href="${p.url_sofia || p.url || "#"}" target="_blank" rel="noopener">Inscribirme <span aria-hidden="true">→</span></a>
      </div>`;
        }
      )
      .join("");
  }

  cargarProgramas();

  // ---------- 2b. NOVEDADES (vienen del backend, las publica el admin) ----------
  // Fotos de apoyo: mismo diseño de las tarjetas fijas. Se usan solo cuando
  // la novedad aún no trae portada propia del panel.
  const NOVEDADES_APOYO = [
    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80",
  ];
  async function cargarNovedades() {
    const grid = document.getElementById("newsGrid");
    if (!grid) return;
    try {
      const novedades = await pedir(API_URL + "/novedades");
      if (!novedades.length) return; // sin datos: se quedan las fijas del HTML
      grid.innerHTML = novedades.slice(0, 3).map((n, i) => {
        const apoyo = NOVEDADES_APOYO[i % NOVEDADES_APOYO.length];
        // Portada real del admin; cualquier tamaño se recorta igual (cover 200px).
        const img = n.imagen || apoyo;
        return `
        <article class="news-card">
          <div class="news-image"><img src="${escHtml(img)}" alt="${escHtml(n.titulo || "Novedad")}" loading="lazy" onerror="this.onerror=null;this.src='${apoyo}'"><span class="news-tag">${n.etiqueta || "Noticia"}</span></div>
          <div class="news-content"><span class="news-date">${n.fecha || ""}</span><h3>${n.titulo}</h3><p>${n.descripcion || ""}</p></div>
        </article>`;
      }).join("");
    } catch (err) {
      console.warn("Novedades offline, muestro las fijas.", err);
    }
  }

  cargarNovedades();

  // ---------- 2c. EVIDENCIAS PÚBLICAS (las publica el admin, visible=true) ----------
  function escHtml(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  async function cargarEvidenciasPublicas() {
    const grid = document.getElementById("evidenceGrid");
    if (!grid) return;
    try {
      // Sin token: el backend solo devuelve visible=true (lo público).
      const items = await pedir(API_URL + "/evidencias");
      if (!items.length) return; // sin datos: se queda el aviso fijo del HTML
      evidenciasCache = items.slice(0, 6);
      grid.innerHTML = evidenciasCache.map((e, idx) => {
        const imagenes = Array.isArray(e.imagenes) ? e.imagenes.filter(Boolean) : [];
        const portada = imagenes[0] || "";
        const extras = imagenes.slice(1, 4);
        // Marco uniforme: la portada siempre ocupa el mismo espacio (16/10 + cover),
        // sin importar si la foto subida es vertical, panorámica o pequeña.
        const media = portada
          ? `<div class="news-image evidence-media"><img src="${escHtml(portada)}" alt="${escHtml(e.titulo || "Evidencia")}" loading="lazy" onerror="this.closest('.evidence-media')?.classList.add('is-broken');this.remove()"><span class="news-tag">${escHtml(e.tipo || "Actividad")}</span>${extras.length ? `<span class="ev-count">+${extras.length} foto${extras.length > 1 ? "s" : ""}</span>` : ""}</div>`
          : `<div class="news-image evidence-media is-empty" aria-hidden="true"><span class="ev-placeholder">SENA · CFDCM</span><span class="news-tag">${escHtml(e.tipo || "Actividad")}</span></div>`;
        const thumbs = extras.length
          ? `<div class="ev-thumbs">${extras.map((u, i) => `<span class="ev-thumb"><img src="${escHtml(u)}" alt="${escHtml(e.titulo || "Evidencia")} foto ${i + 2}" loading="lazy" onerror="this.closest('.ev-thumb')?.remove()"></span>`).join("")}</div>`
          : "";
        return `<article class="news-card evidence-card" data-ev="${idx}" tabindex="0" role="button" aria-label="Ver detalle: ${escHtml(e.titulo || "Actividad SENA")}">${media}
          <div class="news-content"><span class="news-date">Ficha ${escHtml(e.ficha_numero || "")} · ${escHtml(e.fecha || "")}</span><h3>${escHtml(e.titulo || "Actividad SENA")}</h3><p>${escHtml(e.descripcion || "")}</p>${thumbs}<span class="ev-more">Ver detalle →</span></div>
        </article>`;
      }).join("");
    } catch (err) {
      console.warn("Evidencias offline, muestro aviso fijo.", err);
    }
  }

  cargarEvidenciasPublicas();

  // ---------- 2d. DETALLE DE EVIDENCIA (modal para el aprendiz) ----------
  // Clic en la tarjeta: galería completa + qué se hizo, con detalle.
  let evidenciasCache = [];
  let evOrigenFoco = null;

  function asegurarModal() {
    let modal = document.getElementById("evModal");
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "evModal";
    modal.className = "ev-modal";
    modal.hidden = true;
    modal.innerHTML =
      '<div class="ev-modal-backdrop" data-close></div>' +
      '<div class="ev-modal-card" role="dialog" aria-modal="true" aria-label="Detalle de evidencia">' +
      '<button type="button" class="ev-modal-close" data-close aria-label="Cerrar detalle">×</button>' +
      '<div class="ev-modal-media"><img id="evModalImg" alt="Foto de la evidencia"></div>' +
      '<div id="evModalThumbs" class="ev-modal-thumbs"></div>' +
      '<div class="ev-modal-body">' +
      '<div class="ev-modal-meta"><span id="evModalTag" class="ev-modal-tag"></span><span id="evModalDate" class="news-date"></span></div>' +
      "<h3 id='evModalTitle'></h3>" +
      "<p id='evModalDesc'></p>" +
      "</div></div>";
    document.body.appendChild(modal);
    modal.addEventListener("click", (e) => {
      if (e.target.closest("[data-close]")) cerrarDetalle();
      const t = e.target.closest(".ev-modal-thumbs img");
      if (t) {
        const grande = document.getElementById("evModalImg");
        grande.src = t.src;
        grande.alt = t.alt;
        modal.querySelectorAll(".ev-modal-thumbs img").forEach((m) => m.classList.remove("active"));
        t.classList.add("active");
      }
    });
    return modal;
  }

  function abrirDetalle(idx) {
    const e = evidenciasCache[idx];
    if (!e) return;
    const modal = asegurarModal();
    evOrigenFoco = document.activeElement;
    const imagenes = Array.isArray(e.imagenes) ? e.imagenes.filter(Boolean) : [];
    const grande = document.getElementById("evModalImg");
    const media = modal.querySelector(".ev-modal-media");
    if (imagenes.length) {
      media.style.display = "";
      grande.src = imagenes[0];
      grande.alt = e.titulo || "Evidencia";
    } else {
      media.style.display = "none";
    }
    const tira = document.getElementById("evModalThumbs");
    tira.innerHTML = "";
    imagenes.forEach((u, i) => {
      const img = document.createElement("img");
      img.src = u;
      img.alt = (e.titulo || "Evidencia") + " foto " + (i + 1);
      img.loading = "lazy";
      if (i === 0) img.classList.add("active");
      img.onerror = () => img.remove();
      tira.appendChild(img);
    });
    tira.style.display = imagenes.length > 1 ? "" : "none";
    document.getElementById("evModalTag").textContent = e.tipo || "Actividad";
    document.getElementById("evModalDate").textContent =
      "Ficha " + (e.ficha_numero || "") + " · " + (e.fecha || "");
    document.getElementById("evModalTitle").textContent = e.titulo || "Actividad SENA";
    document.getElementById("evModalDesc").textContent =
      e.descripcion || "Sin detalle registrado.";
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    modal.querySelector(".ev-modal-close").focus();
  }

  function cerrarDetalle() {
    const modal = document.getElementById("evModal");
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = "";
    if (evOrigenFoco && evOrigenFoco.focus) evOrigenFoco.focus();
  }

  document.getElementById("evidenceGrid")?.addEventListener("click", (e) => {
    const card = e.target.closest(".evidence-card[data-ev]");
    if (card) abrirDetalle(Number(card.dataset.ev));
  });
  document.getElementById("evidenceGrid")?.addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && e.target.matches(".evidence-card[data-ev]")) {
      e.preventDefault();
      abrirDetalle(Number(e.target.dataset.ev));
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !document.getElementById("evModal")?.hidden) cerrarDetalle();
  });

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
    if (/hola|buenas|ayuda|menu/.test(t)) return "¡Hola! 👋 Soy Carmencho. Puedo orientarte sobre programas, inscripciones en Sofia Plus, requisitos y costos. ¿Qué te interesa?";
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
        body: JSON.stringify({ mensaje: texto, detalle: "corto" }),
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

  // ---------- 6b. PANEL DEL CHAT: mover (con gelatina), tamaño y detalle ----------
  // Vive al nivel del DOMContentLoaded: sus listeners se activan al cargar,
  // no dentro de enviarMensaje. La posición/tamaño/detalle persisten.
  const chatHeader = document.getElementById("chatHeader");
  const clearChat = document.getElementById("clearChat");
  const resetChatPos = document.getElementById("resetChatPos");
  const chatResize = document.getElementById("chatResize");
  const esMovil = () => window.matchMedia("(max-width: 480px)").matches;

  function leer(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : JSON.parse(v);
    } catch {
      return fallback;
    }
  }
  function guardar(key, valor) {
    try {
      localStorage.setItem(key, JSON.stringify(valor));
    } catch {
      /* almacenamiento lleno o bloqueado: el panel igual funciona */
    }
  }

  // Estado guardado: posición y tamaño del panel.
  (function aplicarGuardados() {
    const pos = leer("carmencho-pos", null);
    if (pos && !esMovil() && pos.left >= 0 && pos.top >= 0 &&
        pos.left < window.innerWidth - 100 && pos.top < window.innerHeight - 100) {
      chatBox.style.left = pos.left + "px";
      chatBox.style.top = pos.top + "px";
      chatBox.style.right = "auto";
      chatBox.style.bottom = "auto";
    }
    const size = leer("carmencho-size", null);
    if (size && !esMovil()) {
      chatBox.style.width = size.w + "px";
      chatBox.style.height = size.h + "px";
    }
    try {
      localStorage.removeItem("carmencho-wide");
      localStorage.removeItem("carmencho-blur");
      localStorage.removeItem("carmencho-detalle");
    } catch {
      /* noop */
    }
  })();

  // Arrastrar desde la cabecera (mouse y táctil).
  // Los botones no arrastran: cada uno hace su propia acción.
  // Listeners en window: el panel sigue al cursor aunque salga de la barra.
  chatHeader?.addEventListener("pointerdown", (e) => {
    if (esMovil()) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (e.target.closest("button, select, input")) return;
    e.preventDefault();
    const rect = chatBox.getBoundingClientRect();
    const dx = e.clientX - rect.left;
    const dy = e.clientY - rect.top;
    let ultimoX = e.clientX;
    chatBox.classList.add("is-dragging");
    chatBox.classList.remove("jelly-pop");
    const mover = (ev) => {
      const x = Math.min(Math.max(0, ev.clientX - dx), window.innerWidth - 80);
      const y = Math.min(Math.max(0, ev.clientY - dy), window.innerHeight - 60);
      chatBox.style.left = x + "px";
      chatBox.style.top = y + "px";
      chatBox.style.right = "auto";
      chatBox.style.bottom = "auto";
      // Gelatina: el panel se inclina según la velocidad horizontal.
      const vel = ev.clientX - ultimoX;
      ultimoX = ev.clientX;
      const sesgo = Math.max(-7, Math.min(7, vel * 0.4));
      const estiron = 1 + Math.min(0.025, Math.abs(vel) * 0.0006);
      chatBox.style.transform = `skewX(${-sesgo}deg) scale(${estiron})`;
    };
    const soltar = (ev) => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
      window.removeEventListener("pointercancel", soltar);
      chatBox.classList.remove("is-dragging");
      chatBox.style.transform = "";
      // Rebote gelatinoso al soltar.
      chatBox.classList.remove("jelly-pop");
      void chatBox.offsetWidth;
      chatBox.classList.add("jelly-pop");
      setTimeout(() => chatBox.classList.remove("jelly-pop"), 550);
      guardar("carmencho-pos", {
        left: Math.round(Math.min(Math.max(0, ev.clientX - dx), window.innerWidth - 80)),
        top: Math.round(Math.min(Math.max(0, ev.clientY - dy), window.innerHeight - 60)),
      });
    };
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
    window.addEventListener("pointercancel", soltar);
  });

  function recolocar() {
    chatBox.style.left = "";
    chatBox.style.top = "";
    chatBox.style.right = "";
    chatBox.style.bottom = "";
    chatBox.style.width = "";
    chatBox.style.height = "";
    try {
      localStorage.removeItem("carmencho-pos");
      localStorage.removeItem("carmencho-size");
    } catch {
      /* noop */
    }
  }
  resetChatPos?.addEventListener("click", recolocar);

  // Doble clic en la cabecera: volver a la esquina.
  chatHeader?.addEventListener("dblclick", (e) => {
    if (e.target.closest("button")) return;
    recolocar();
  });

  // Redimensionar desde la esquina inferior izquierda.
  chatResize?.addEventListener("pointerdown", (e) => {
    if (esMovil()) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = chatBox.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = rect.width;
    const startH = rect.height;
    const startLeft = rect.left;
    const startTop = rect.top;
    // Fijamos la esquina superior derecha y movemos la inferior izquierda.
    chatBox.style.left = startLeft + "px";
    chatBox.style.top = startTop + "px";
    chatBox.style.right = "auto";
    chatBox.style.bottom = "auto";
    const redim = (ev) => {
      const w = Math.min(Math.max(280, startW - (ev.clientX - startX)), Math.min(440, window.innerWidth - 32));
      const h = Math.min(Math.max(360, startH + (ev.clientY - startY)), Math.min(640, window.innerHeight - 112));
      chatBox.style.width = w + "px";
      chatBox.style.height = h + "px";
      chatBox.style.left = (startLeft + (startW - w)) + "px";
    };
    const fin = () => {
      window.removeEventListener("pointermove", redim);
      window.removeEventListener("pointerup", fin);
      window.removeEventListener("pointercancel", fin);
      guardar("carmencho-size", {
        w: Math.round(chatBox.getBoundingClientRect().width),
        h: Math.round(chatBox.getBoundingClientRect().height),
      });
      guardar("carmencho-pos", {
        left: Math.round(chatBox.getBoundingClientRect().left),
        top: Math.round(chatBox.getBoundingClientRect().top),
      });
    };
    window.addEventListener("pointermove", redim);
    window.addEventListener("pointerup", fin);
    window.addEventListener("pointercancel", fin);
  });

  // Papelera: limpia la conversación y deja el saludo inicial.
  clearChat?.addEventListener("click", () => {
    const mensajes = [...chatMessages.children];
    mensajes.slice(1).forEach((m) => m.remove());
    pintarChips(CHIPS_INICIALES);
    chatMessages.scrollTop = 0;
    chatInput?.focus();
  });

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
