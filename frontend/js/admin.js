/* Panel admin SENA Dajesa.
 * Solo entra quien tenga rol "administrador".
 * Cada sección: carga la lista (GET público) y guarda (POST con token).
 */
document.addEventListener("DOMContentLoaded", () => {
  const API_URL = window.API_URL || "http://127.0.0.1:8000/api/v1";
  const token = localStorage.getItem("access_token");

  // Sin token no hay panel: al login.
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + token,
  };

  async function pedir(url, opciones) {
    const res = await fetch(url, opciones);
    if (res.status === 401 || res.status === 403) {
      // Sin permiso: fuera del panel.
      localStorage.removeItem("access_token");
      window.location.href = "login.html";
      throw new Error("sin permiso");
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Error " + res.status);
    }
    return res.json();
  }

  // ---------- Puerta de entrada: solo administradores ----------
  pedir(API_URL + "/auth/yo", { headers: authHeaders })
    .then((yo) => {
      if (!yo || yo.rol !== "administrador") {
        alert("Esta zona es solo para administradores.");
        window.location.href = "index.html";
        return;
      }
      document.getElementById("adminName").textContent = yo.email || "Admin";
      const rolEtiqueta = document.getElementById("adminRole");
      if (rolEtiqueta && yo.rol) {
        rolEtiqueta.textContent =
          yo.rol.charAt(0).toUpperCase() + yo.rol.slice(1);
      }
      const avatarInicial = document.getElementById("adminAvatar");
      if (avatarInicial) {
        avatarInicial.textContent = (yo.email || "A").trim().charAt(0).toUpperCase();
      }
      cargarTodo();
    })
    .catch(() => { /* pedir() ya redirige al login */ });

  document.getElementById("btnSalir").addEventListener("click", () => {
    localStorage.removeItem("access_token");
    window.location.href = "index.html";
  });

  // ---------- Listas con editar y borrar ----------
  // Cache de lo cargado (para rellenar el formulario al editar sin otro GET).
  const datos = { novedades: [], fichas: [], postulaciones: [] };
  // Id en edición por sección, o null si se está creando.
  const editando = { novedad: null, ficha: null, postulacion: null };

  function botonesMini(id, prefijo) {
    if (id == null) return "";
    return `<div class="item-actions">`
      + `<button class="mini-btn edit" type="button" data-editar-${prefijo}="${id}" title="Editar" aria-label="Editar">✎</button>`
      + `<button class="mini-btn del" type="button" data-borrar-${prefijo}="${id}" title="Eliminar" aria-label="Eliminar">×</button>`
      + `</div>`;
  }

  function tarjetaNovedad(n) {
    const etiqueta = (n.etiqueta || "Noticia").trim() || "Noticia";
    const fecha = (n.fecha || "").trim();
    return `<li class="item-card item-nov">`
      + `<div class="item-top"><strong>${esc(n.titulo)}</strong><span class="tag tag-nov">${esc(etiqueta)}</span></div>`
      + (n.descripcion ? `<p class="item-desc">${esc(n.descripcion)}</p>` : "")
      + `<div class="item-foot"><small class="item-meta">${esc(fecha) || "Sin fecha"}</small>${botonesMini(n.id, "nov")}</div>`
      + `</li>`;
  }

  function filaFicha(f) {
    return `<tr><td><span class="cell-code">${esc(f.numero)}</span></td>`
      + `<td>${esc(f.programa)}</td>`
      + `<td><span class="tag tag-jornada">${esc(f.jornada)}</span></td>`
      + `<td>${botonesMini(f.id, "fic")}</td></tr>`;
  }

  function tarjetaPostulacion(p) {
    const cupos = Number(p.cupos) || 0;
    const cierre = (p.fecha_cierre || "").trim();
    return `<li class="item-card item-pos">`
      + `<div class="item-top"><strong>${esc(p.titulo)}</strong><span class="tag tag-cupos">${cupos} ${cupos === 1 ? "cupo" : "cupos"}</span></div>`
      + (p.descripcion ? `<p class="item-desc">${esc(p.descripcion)}</p>` : "")
      + `<div class="item-foot"><small class="item-meta">${cierre ? "Cierra " + esc(cierre) : "Sin fecha de cierre"}</small>${botonesMini(p.id, "pos")}</div>`
      + `</li>`;
  }

  const VACIO = {
    nov: `<li class="empty-note empty-nov">Aún no hay novedades. Publica la primera con el formulario de arriba.</li>`,
    pos: `<li class="empty-note empty-pos">No hay postulaciones abiertas. Abre la primera con el formulario de arriba.</li>`,
    fic: `<tr><td colspan="4" class="cell-empty">Aún no hay fichas registradas. Crea la primera con el formulario.</td></tr>`,
  };

  function enlazarAcciones(cont, prefijo, alEditar, alBorrar) {
    const clave = "editar" + prefijo[0].toUpperCase() + prefijo.slice(1);
    const claveBorrar = "borrar" + prefijo[0].toUpperCase() + prefijo.slice(1);
    cont.querySelectorAll(`[data-editar-${prefijo}]`).forEach((b) =>
      b.addEventListener("click", () => alEditar(b.dataset[clave])));
    cont.querySelectorAll(`[data-borrar-${prefijo}]`).forEach((b) =>
      b.addEventListener("click", () => alBorrar(b.dataset[claveBorrar])));
  }

  async function cargarTodo() {
    try {
      datos.novedades = await pedir(API_URL + "/novedades");
      const listaNov = document.getElementById("listaNovedades");
      listaNov.innerHTML = datos.novedades.length
        ? datos.novedades.map(tarjetaNovedad).join("")
        : VACIO.nov;
      enlazarAcciones(listaNov, "nov", entrarEdicionNovedad, borrarNovedad);
    } catch (e) { console.warn(e); }

    try {
      datos.fichas = await pedir(API_URL + "/fichas");
      const cuerpoFic = document.getElementById("listaFichas");
      cuerpoFic.innerHTML = datos.fichas.length
        ? datos.fichas.map(filaFicha).join("")
        : VACIO.fic;
      enlazarAcciones(cuerpoFic, "fic", entrarEdicionFicha, borrarFicha);
    } catch (e) { console.warn(e); }

    try {
      datos.postulaciones = await pedir(API_URL + "/postulaciones");
      const listaPos = document.getElementById("listaPostulaciones");
      listaPos.innerHTML = datos.postulaciones.length
        ? datos.postulaciones.map(tarjetaPostulacion).join("")
        : VACIO.pos;
      enlazarAcciones(listaPos, "pos", entrarEdicionPostulacion, borrarPostulacion);
    } catch (e) { console.warn(e); }

    cargarSelectorFichas();
  }

  // ---------- Formularios: crear y editar ----------
  function leerCampos(campos) {
    const datos = {};
    campos.forEach(([id, clave, numero]) => {
      const valor = document.getElementById(id).value.trim();
      datos[clave] = numero ? Number(valor) : valor;
    });
    return datos;
  }

  // Novedades
  function entrarEdicionNovedad(id) {
    const n = datos.novedades.find((x) => String(x.id) === String(id));
    if (!n) return;
    editando.novedad = n.id;
    document.getElementById("novTitulo").value = n.titulo || "";
    document.getElementById("novEtiqueta").value = n.etiqueta || "";
    document.getElementById("novFecha").value = n.fecha || "";
    document.getElementById("novDesc").value = n.descripcion || "";
    document.getElementById("novSubmit").textContent = "Guardar cambios";
    document.getElementById("novCancelar").classList.remove("hidden");
    document.getElementById("sec-novedades").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function salirEdicionNovedad() {
    editando.novedad = null;
    document.getElementById("formNovedad").reset();
    document.getElementById("novSubmit").textContent = "Publicar novedad";
    document.getElementById("novCancelar").classList.add("hidden");
    document.getElementById("msgNovedad").textContent = "";
  }

  document.getElementById("formNovedad").addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = document.getElementById("msgNovedad");
    const cuerpo = leerCampos(
      [["novTitulo", "titulo"], ["novEtiqueta", "etiqueta"], ["novFecha", "fecha"], ["novDesc", "descripcion"]]);
    msg.textContent = "Guardando…";
    try {
      if (editando.novedad) {
        await pedir(API_URL + "/novedades/" + editando.novedad,
          { method: "PUT", headers: authHeaders, body: JSON.stringify(cuerpo) });
      } else {
        await pedir(API_URL + "/novedades",
          { method: "POST", headers: authHeaders, body: JSON.stringify(cuerpo) });
      }
      const eraEdicion = editando.novedad;
      salirEdicionNovedad();
      msg.textContent = eraEdicion ? "✓ Novedad actualizada." : "✓ Novedad publicada.";
      cargarTodo();
    } catch (err) {
      msg.textContent = "✕ " + err.message;
    }
  });
  document.getElementById("novCancelar").addEventListener("click", salirEdicionNovedad);

  async function borrarNovedad(id) {
    const n = datos.novedades.find((x) => String(x.id) === String(id));
    if (!confirm(`¿Eliminar la novedad "${(n && n.titulo) || ""}"?`)) return;
    const msg = document.getElementById("msgNovedad");
    try {
      await pedir(API_URL + "/novedades/" + id, { method: "DELETE", headers: authHeaders });
      if (String(editando.novedad) === String(id)) salirEdicionNovedad();
      msg.textContent = "✓ Novedad eliminada.";
      cargarTodo();
    } catch (err) { msg.textContent = "✕ " + err.message; }
  }

  // Fichas
  function entrarEdicionFicha(id) {
    const f = datos.fichas.find((x) => String(x.id) === String(id));
    if (!f) return;
    editando.ficha = f.id;
    document.getElementById("ficNumero").value = f.numero || "";
    document.getElementById("ficPrograma").value = f.programa || "";
    document.getElementById("ficJornada").value = f.jornada || "";
    document.getElementById("ficSubmit").textContent = "Guardar cambios";
    document.getElementById("ficCancelar").classList.remove("hidden");
    document.getElementById("sec-fichas").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function salirEdicionFicha() {
    editando.ficha = null;
    document.getElementById("formFicha").reset();
    document.getElementById("ficSubmit").textContent = "Guardar ficha";
    document.getElementById("ficCancelar").classList.add("hidden");
    document.getElementById("msgFicha").textContent = "";
  }

  document.getElementById("formFicha").addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = document.getElementById("msgFicha");
    const cuerpo = leerCampos(
      [["ficNumero", "numero"], ["ficPrograma", "programa"], ["ficJornada", "jornada"]]);
    msg.textContent = "Guardando…";
    try {
      if (editando.ficha) {
        await pedir(API_URL + "/fichas/" + editando.ficha,
          { method: "PUT", headers: authHeaders, body: JSON.stringify(cuerpo) });
      } else {
        await pedir(API_URL + "/fichas",
          { method: "POST", headers: authHeaders, body: JSON.stringify(cuerpo) });
      }
      const eraEdicion = editando.ficha;
      salirEdicionFicha();
      msg.textContent = eraEdicion ? "✓ Ficha actualizada." : "✓ Ficha guardada.";
      cargarTodo();
    } catch (err) {
      msg.textContent = "✕ " + err.message;
    }
  });
  document.getElementById("ficCancelar").addEventListener("click", salirEdicionFicha);

  async function borrarFicha(id) {
    const f = datos.fichas.find((x) => String(x.id) === String(id));
    if (!confirm(`¿Eliminar la ficha ${(f && f.numero) || ""}? Su bitácora quedará sin ficha asociada.`)) return;
    const msg = document.getElementById("msgFicha");
    try {
      await pedir(API_URL + "/fichas/" + id, { method: "DELETE", headers: authHeaders });
      if (String(editando.ficha) === String(id)) salirEdicionFicha();
      msg.textContent = "✓ Ficha eliminada.";
      cargarTodo();
    } catch (err) { msg.textContent = "✕ " + err.message; }
  }

  // Postulaciones
  function entrarEdicionPostulacion(id) {
    const p = datos.postulaciones.find((x) => String(x.id) === String(id));
    if (!p) return;
    editando.postulacion = p.id;
    document.getElementById("posTitulo").value = p.titulo || "";
    document.getElementById("posDesc").value = p.descripcion || "";
    document.getElementById("posCupos").value = p.cupos ?? "";
    document.getElementById("posCierre").value = p.fecha_cierre || "";
    document.getElementById("posSubmit").textContent = "Guardar cambios";
    document.getElementById("posCancelar").classList.remove("hidden");
    document.getElementById("sec-postulaciones").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function salirEdicionPostulacion() {
    editando.postulacion = null;
    document.getElementById("formPostulacion").reset();
    document.getElementById("posSubmit").textContent = "Abrir postulación";
    document.getElementById("posCancelar").classList.add("hidden");
    document.getElementById("msgPostulacion").textContent = "";
  }

  document.getElementById("formPostulacion").addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = document.getElementById("msgPostulacion");
    const cuerpo = leerCampos(
      [["posTitulo", "titulo"], ["posDesc", "descripcion"], ["posCupos", "cupos", true], ["posCierre", "fecha_cierre"]]);
    msg.textContent = "Guardando…";
    try {
      if (editando.postulacion) {
        await pedir(API_URL + "/postulaciones/" + editando.postulacion,
          { method: "PUT", headers: authHeaders, body: JSON.stringify(cuerpo) });
      } else {
        await pedir(API_URL + "/postulaciones",
          { method: "POST", headers: authHeaders, body: JSON.stringify(cuerpo) });
      }
      const eraEdicion = editando.postulacion;
      salirEdicionPostulacion();
      msg.textContent = eraEdicion ? "✓ Postulación actualizada." : "✓ Postulación abierta.";
      cargarTodo();
    } catch (err) {
      msg.textContent = "✕ " + err.message;
    }
  });
  document.getElementById("posCancelar").addEventListener("click", salirEdicionPostulacion);

  async function borrarPostulacion(id) {
    const p = datos.postulaciones.find((x) => String(x.id) === String(id));
    if (!confirm(`¿Eliminar la postulación "${(p && p.titulo) || ""}"?`)) return;
    const msg = document.getElementById("msgPostulacion");
    try {
      await pedir(API_URL + "/postulaciones/" + id, { method: "DELETE", headers: authHeaders });
      if (String(editando.postulacion) === String(id)) salirEdicionPostulacion();
      msg.textContent = "✓ Postulación eliminada.";
      cargarTodo();
    } catch (err) { msg.textContent = "✕ " + err.message; }
  }

  // ---------- Bitácora por ficha ----------
  const selFicha = document.getElementById("eviFicha");
  const inputFotos = document.getElementById("eviFotos");
  const preview = document.getElementById("eviPreview");
  const msgEvi = document.getElementById("msgEvidencia");

  // Diagnóstico de Storage: avisa en el panel si falta el bucket o las policies.
  (async () => {
    const aviso = document.getElementById("msgStorage");
    if (!aviso) return;
    try {
      const estado = await pedir(API_URL + "/evidencias/status", { headers: authHeaders });
      if (!estado.bucket || !estado.puede_subir) {
        aviso.textContent = "⚠ " + (estado.detalle || "Storage no disponible.");
      } else {
        aviso.textContent = "";
      }
    } catch (e) { console.warn(e); }
  })();

  inputFotos.addEventListener("change", () => {
    const archivos = Array.from(inputFotos.files || []).slice(0, 4);
    preview.innerHTML = "";
    archivos.forEach((f) => {
      const img = document.createElement("img");
      img.src = URL.createObjectURL(f);
      img.alt = f.name;
      img.onload = () => URL.revokeObjectURL(img.src);
      preview.appendChild(img);
    });
  });

  function esc(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  async function cargarSelectorFichas() {
    try {
      const fichas = await pedir(API_URL + "/fichas");
      selFicha.innerHTML = fichas.length
        ? fichas.map((f) => `<option value="${esc(f.numero)}">${esc(f.numero)} · ${esc(f.programa)}</option>`).join("")
        : `<option value="">Sin fichas: crea una arriba</option>`;
      if (fichas.length) cargarEvidencias();
    } catch (e) {
      selFicha.innerHTML = `<option value="">No se pudieron cargar</option>`;
    }
  }

  async function cargarEvidencias() {
    const numero = selFicha.value;
    const cont = document.getElementById("listaEvidencias");
    if (!numero) { cont.innerHTML = ""; return; }
    try {
      const items = await pedir(API_URL + "/evidencias?ficha=" + encodeURIComponent(numero), { headers: authHeaders });
      cont.innerHTML = items.length ? items.map((e) => `
        <article class="evi-item">
          <div class="evi-top">
            <strong>${esc(e.titulo)}</strong>
            <span class="badge badge-tipo">${esc(e.tipo || "clase")}</span>
            ${e.visible
              ? `<span class="badge badge-pub">Pública</span>`
              : `<span class="badge badge-priv">Privada</span>`}
            <small>· ${esc(e.fecha || "")}</small>
          </div>
          ${e.descripcion ? `<p>${esc(e.descripcion)}</p>` : ""}
          ${(e.imagenes || []).length ? `<div class="evi-gallery">${(e.imagenes || []).map((u) => `<a href="${esc(u)}" target="_blank" rel="noopener"><img src="${esc(u)}" alt="${esc(e.titulo)}" loading="lazy"></a>`).join("")}</div>` : ""}
          <div class="evi-actions"><button class="btn-danger" type="button" data-borrar="${e.id}">Borrar</button></div>
        </article>`).join("")
        : `<p class="empty-note">Aún no hay registros para la ficha ${esc(numero)}. Sé el primero en documentar qué se hizo.</p>`;
      cont.querySelectorAll("[data-borrar]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          if (!confirm("¿Borrar esta entrada de la bitácora?")) return;
          try {
            await pedir(API_URL + "/evidencias/" + btn.dataset.borrar, { method: "DELETE", headers: authHeaders });
            cargarEvidencias();
          } catch (err) { msgEvi.textContent = "✕ " + err.message; }
        });
      });
    } catch (e) { console.warn(e); }
  }

  selFicha.addEventListener("change", cargarEvidencias);

  document.getElementById("formEvidencia").addEventListener("submit", async (e) => {
    e.preventDefault();
    const numero = selFicha.value;
    if (!numero) { msgEvi.textContent = "✕ Elige una ficha primero."; return; }
    const archivos = Array.from(inputFotos.files || []).slice(0, 4);
    msgEvi.textContent = archivos.length ? "Subiendo fotos…" : "Guardando…";
    try {
      const urls = [];
      for (const f of archivos) {
        const form = new FormData();
        form.append("archivo", f);
        const sub = await pedir(
          API_URL + "/evidencias/upload?ficha_numero=" + encodeURIComponent(numero),
          { method: "POST", headers: { Authorization: "Bearer " + token }, body: form }
        );
        urls.push(sub.url);
      }
      await pedir(API_URL + "/evidencias", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          ficha_numero: numero,
          titulo: document.getElementById("eviTitulo").value.trim(),
          descripcion: document.getElementById("eviDesc").value.trim(),
          fecha: document.getElementById("eviFecha").value.trim(),
          tipo: document.getElementById("eviTipo").value,
          imagenes: urls,
          visible: document.getElementById("eviVisible").checked,
        }),
      });
      msgEvi.textContent = "✓ Guardado en la bitácora.";
      e.target.reset();
      document.getElementById("eviVisible").checked = true;
      preview.innerHTML = "";
      cargarEvidencias();
    } catch (err) { msgEvi.textContent = "✕ " + err.message; }
  });

  // ---------- Programas: stats, buscador, tabla, modal, toast ----------
  const AREAS = [
    "Tecnología de la Información y las Comunicaciones",
    "Finanzas y Administración",
    "Industria de la Alimentación",
    "Educación",
    "Turismo, Hotelería y Restauración",
    "Electricidad y Energía",
    "Mecánica",
    "Trabajo Social y Desarrollo Comunitario",
    "Comunicación, Arte y Diseño",
    "Gestión del Talento Humano",
    "Construcción e Infraestructura",
    "Comercio, Marketing y Logística",
    "Otra",
  ];
  document.getElementById("pmArea").innerHTML =
    `<option value="">Selecciona un área</option>` + AREAS.map((a) => `<option value="${a}">${a}</option>`).join("");

  let programas = [];
  let editingId = null;
  let filtroNivel = "all";
  let pmSkills = [];
  let borrarId = null;
  let toastTimer = null;

  function toast(msg) {
    const t = document.getElementById("toast");
    t.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l4 4 6-7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>` + esc(msg);
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 3000);
  }

  function nivelNorm(p) {
    return String(p.nivel || "").toLowerCase().startsWith("tecnolog") ? "tecnologia" : "tecnica";
  }

  function nombreProg(p) { return p.nombre || p.titulo || ""; }

  function pintarStats() {
    const tec = programas.filter((p) => nivelNorm(p) === "tecnica").length;
    const teg = programas.filter((p) => nivelNorm(p) === "tecnologia").length;
    document.getElementById("statTotal").textContent = programas.length;
    document.getElementById("statTecnicas").textContent = tec;
    document.getElementById("statTecnologias").textContent = teg;
    document.getElementById("statAreas").textContent = new Set(programas.map((p) => p.area).filter(Boolean)).size;
  }

  function pintarProgramas() {
    const q = (document.getElementById("progSearch").value || "").toLowerCase().trim();
    const lista = programas.filter((p) => {
      const okNivel = filtroNivel === "all" || nivelNorm(p) === filtroNivel;
      const texto = `${nombreProg(p)} ${(p.codigo || "")} ${(p.area || "")}`.toLowerCase();
      return okNivel && (!q || texto.includes(q));
    });
    document.getElementById("listaProgramas").innerHTML = lista.length ? lista.map((p) => `
      <tr>
        <td><p class="cell-name">${esc(nombreProg(p))}</p><p class="cell-sub">${esc(p.titulacion || "")}</p></td>
        <td><span class="cell-code">${esc(p.codigo || "—")}</span></td>
        <td><span class="nivel-badge ${nivelNorm(p) === "tecnologia" ? "nivel-teg" : "nivel-tec"}">${nivelNorm(p) === "tecnologia" ? "Tecnólogo" : "Técnico"}</span></td>
        <td><p class="cell-area">${esc(p.area || "—")}</p></td>
        <td><span class="cell-dur">${esc(p.duracion || "—")}</span></td>
        <td><span class="mod-badge" data-mod="${esc((p.modalidad || "").toLowerCase())}">${esc(p.modalidad || "—")}</span></td>
        <td><div style="display:flex;gap:.25rem">
          <button class="icon-btn edit" data-editar="${p.id}" title="Editar" aria-label="Editar ${esc(nombreProg(p))}">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M10 2l2 2-8 8H2v-2L10 2z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
          </button>
          <button class="icon-btn del" data-borrar-prog="${p.id}" title="Eliminar" aria-label="Eliminar ${esc(nombreProg(p))}">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M5 4V2.5h4V4M11 4l-.8 8H3.8L3 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
          </button>
        </div></td>
      </tr>`).join("")
      : `<tr><td colspan="7" class="cell-empty">No se encontraron programas con los filtros actuales</td></tr>`;
    document.getElementById("progCount").textContent =
      `Mostrando ${lista.length} de ${programas.length} programas`;
    document.querySelectorAll("[data-editar]").forEach((b) =>
      b.addEventListener("click", () => abrirModal(Number(b.dataset.editar))));
    document.querySelectorAll("[data-borrar-prog]").forEach((b) =>
      b.addEventListener("click", () => {
        const p = programas.find((x) => String(x.id) === b.dataset.borrarProg);
        borrarId = b.dataset.borrarProg;
        document.getElementById("borrarNombre").textContent = `"${nombreProg(p || {})}"`;
        document.getElementById("modalBorrar").classList.remove("hidden");
      }));
  }

  async function cargarProgramas() {
    try {
      programas = await pedir(API_URL + "/programas", { headers: authHeaders });
    } catch (e) {
      try { programas = await pedir(API_URL + "/programas"); }
      catch (e2) { programas = []; }
    }
    pintarStats();
    pintarProgramas();
  }

  document.getElementById("progSearch").addEventListener("input", pintarProgramas);
  document.querySelectorAll(".filter-btn").forEach((b) =>
    b.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      filtroNivel = b.dataset.nivel;
      pintarProgramas();
    }));

  // Modal programa
  function setNivel(v) {
    document.querySelectorAll("#pmNivel button").forEach((b) =>
      b.classList.toggle("active", b.dataset.value === v));
  }
  document.querySelectorAll("#pmNivel button").forEach((b) =>
    b.addEventListener("click", () => setNivel(b.dataset.value)));

  function pintarSkills() {
    document.getElementById("pmSkills").innerHTML = pmSkills.map((s) =>
      `<span class="chip">${esc(s)}<button type="button" data-skill="${esc(s)}" aria-label="Quitar ${esc(s)}">✕</button></span>`).join("");
    document.querySelectorAll("#pmSkills [data-skill]").forEach((b) =>
      b.addEventListener("click", () => {
        pmSkills = pmSkills.filter((x) => x !== b.dataset.skill);
        pintarSkills();
      }));
  }
  function agregarSkill() {
    const inp = document.getElementById("pmSkillInput");
    const v = inp.value.trim();
    if (v && !pmSkills.includes(v) && pmSkills.length < 20) pmSkills.push(v);
    inp.value = "";
    pintarSkills();
  }
  document.getElementById("pmSkillAdd").addEventListener("click", agregarSkill);
  document.getElementById("pmSkillInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); agregarSkill(); }
  });

  function abrirModal(id) {
    editingId = id || null;
    const p = id ? programas.find((x) => String(x.id) === String(id)) : null;
    document.getElementById("modalProgTitulo").textContent = p ? "Editar programa" : "Nuevo programa";
    document.getElementById("pmGuardar").textContent = p ? "Guardar cambios" : "Crear programa";
    setNivel(p ? (nivelNorm(p) === "tecnologia" ? "Tecnólogo" : "Técnico") : "Técnico");
    document.getElementById("pmNombre").value = p ? nombreProg(p) : "";
    document.getElementById("pmCodigo").value = (p && p.codigo) || "";
    document.getElementById("pmArea").value = (p && p.area) || "";
    document.getElementById("pmDuracion").value = (p && p.duracion) || "";
    document.getElementById("pmModalidad").value = (p && p.modalidad) || "Presencial";
    document.getElementById("pmJornada").value = (p && p.jornada) || "diurna";
    document.getElementById("pmTitulacion").value = (p && p.titulacion) || "";
    document.getElementById("pmDesc").value = (p && (p.descripcion || p.desc)) || "";
    document.getElementById("pmUrl").value = (p && (p.url_sofia || p.url)) || "https://oferta.senasofiaplus.edu.co/";
    pmSkills = Array.isArray(p && p.competencias) ? [...p.competencias] : [];
    pintarSkills();
    document.getElementById("errNombre").textContent = "";
    document.getElementById("pmNombre").classList.remove("invalid");
    document.getElementById("modalPrograma").classList.remove("hidden");
  }
  function cerrarModal() { document.getElementById("modalPrograma").classList.add("hidden"); }
  document.getElementById("btnNuevoPrograma").addEventListener("click", () => abrirModal(null));
  document.getElementById("pmCerrar").addEventListener("click", cerrarModal);
  document.getElementById("pmCancelar").addEventListener("click", cerrarModal);
  document.getElementById("modalPrograma").addEventListener("click", (e) => {
    if (e.target.id === "modalPrograma") cerrarModal();
  });

  document.getElementById("formPrograma").addEventListener("submit", async (e) => {
    e.preventDefault();
    const nombre = document.getElementById("pmNombre").value.trim();
    if (nombre.length < 3) {
      document.getElementById("errNombre").textContent = "Nombre requerido (mín. 3 letras).";
      document.getElementById("pmNombre").classList.add("invalid");
      return;
    }
    const nivel = document.querySelector("#pmNivel button.active").dataset.value;
    const datos = {
      nombre,
      codigo: document.getElementById("pmCodigo").value.trim(),
      duracion: document.getElementById("pmDuracion").value.trim(),
      nivel,
      area: document.getElementById("pmArea").value,
      descripcion: document.getElementById("pmDesc").value.trim(),
      competencias: pmSkills,
      modalidad: document.getElementById("pmModalidad").value,
      titulacion: document.getElementById("pmTitulacion").value.trim(),
      jornada: document.getElementById("pmJornada").value,
      url_sofia: document.getElementById("pmUrl").value.trim() || "https://oferta.senasofiaplus.edu.co/",
    };
    try {
      if (editingId) {
        await pedir(API_URL + "/programas/" + editingId, { method: "PUT", headers: authHeaders, body: JSON.stringify(datos) });
        toast("Programa actualizado correctamente");
      } else {
        await pedir(API_URL + "/programas", { method: "POST", headers: authHeaders, body: JSON.stringify(datos) });
        toast("Programa creado correctamente");
      }
      cerrarModal();
      cargarProgramas();
    } catch (err) { toast("✕ " + err.message); }
  });

  document.getElementById("btnBorrarCancelar").addEventListener("click", () =>
    document.getElementById("modalBorrar").classList.add("hidden"));
  document.getElementById("btnBorrarConfirmar").addEventListener("click", async () => {
    try {
      await pedir(API_URL + "/programas/" + borrarId, { method: "DELETE", headers: authHeaders });
      toast("Programa eliminado");
      cargarProgramas();
    } catch (err) { toast("✕ " + err.message); }
    document.getElementById("modalBorrar").classList.add("hidden");
  });

  cargarProgramas();
});
