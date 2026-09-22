// Config central de la app.
// - Si la página la sirve el backend (puertos 800x), usa el mismo origen.
// - Si se abre directo o con Live Server, usa localhost:8000.
window.API_URL = /:800\d/.test(location.origin)
  ? location.origin + "/api/v1"
  : "http://127.0.0.1:8000/api/v1";
