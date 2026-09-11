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
      cargarTodo();
    })
    .catch(() => { /* pedir() ya redirige al login */ });

  document.getElementById("btnSalir").addEventListener("click", () => {
    localStorage.removeItem("access_token");
    window.location.href = "index.html";
  });

  // ---------- Listas ----------
  function pintarLista(id, items, texto) {
    document.getElementById(id).innerHTML = items.map(texto).join("");
  }

  async function cargarTodo() {
    try {
      const novedades = await pedir(API_URL + "/novedades");
      pintarLista("listaNovedades", novedades, (n) =>
        `<li><strong>${n.titulo}</strong> <small>· ${n.etiqueta || ""} · ${n.fecha || ""}</small><br>${n.descripcion || ""}</li>`
      );
    } catch (e) { console.warn(e); }

    try {
      const fichas = await pedir(API_URL + "/fichas");
      document.getElementById("listaFichas").innerHTML = fichas
        .map((f) => `<tr><td>${f.numero}</td><td>${f.programa}</td><td>${f.jornada}</td></tr>`)
        .join("");
    } catch (e) { console.warn(e); }

    try {
      const postulaciones = await pedir(API_URL + "/postulaciones");
      pintarLista("listaPostulaciones", postulaciones, (p) =>
        `<li><strong>${p.titulo}</strong> <small>· ${p.cupos} cupos · cierra ${p.fecha_cierre || "—"}</small><br>${p.descripcion || ""}</li>`
      );
    } catch (e) { console.warn(e); }
  }

  // ---------- Formularios ----------
  function conectarForm(formId, url, campos, msgId) {
    document.getElementById(formId).addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = document.getElementById(msgId);
      const datos = {};
      campos.forEach(([id, clave, numero]) => {
        const valor = document.getElementById(id).value.trim();
        datos[clave] = numero ? Number(valor) : valor;
      });
      try {
        await pedir(url, { method: "POST", headers: authHeaders, body: JSON.stringify(datos) });
        msg.textContent = "✓ Guardado.";
        e.target.reset();
        cargarTodo();
      } catch (err) {
        msg.textContent = "✕ " + err.message;
      }
    });
  }

  conectarForm("formNovedad", API_URL + "/novedades",
    [["novTitulo", "titulo"], ["novEtiqueta", "etiqueta"], ["novFecha", "fecha"], ["novDesc", "descripcion"]],
    "msgNovedad");

  conectarForm("formFicha", API_URL + "/fichas",
    [["ficNumero", "numero"], ["ficPrograma", "programa"], ["ficJornada", "jornada"]],
    "msgFicha");

  conectarForm("formPostulacion", API_URL + "/postulaciones",
    [["posTitulo", "titulo"], ["posDesc", "descripcion"], ["posCupos", "cupos", true], ["posCierre", "fecha_cierre"]],
    "msgPostulacion");
});
