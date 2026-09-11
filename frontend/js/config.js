// Config central de la app.
// - Si abres la página desde el backend (puerto 8000), usa el mismo origen.
// - Si abres index.html directo o con Live Server, usa localhost:8000.
window.API_URL = location.origin.includes(":8000")
  ? location.origin + "/api/v1"
  : "http://127.0.0.1:8000/api/v1";
