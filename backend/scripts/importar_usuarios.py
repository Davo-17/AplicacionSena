"""Importación masiva de usuarios a Supabase Auth (para el administrador).

Evita crear 100 cuentas a mano en el Dashboard: prepara un CSV y el
script crea cada cuenta confirmada, con su rol y su contraseña.

CSV de entrada (con encabezado):
    email,password,rol
    aprendiz1@soy.sena.edu.co,,aprendiz
    instructor@sena.edu.co,ClaveTemporal9,instructor

- password vacío -> se genera una clave temporal segura (12 caracteres).
- rol vacío -> "aprendiz". Permitidos: administrador, instructor, aprendiz.
- Solo correos institucionales (@soy.sena.edu.co o @sena.edu.co).

Uso (desde la carpeta backend, con el venv activado):
    .venv/bin/python scripts/importar_usuarios.py usuarios.csv
    .venv/bin/python scripts/importar_usuarios.py usuarios.csv --salida credenciales.csv
    .venv/bin/python scripts/importar_usuarios.py usuarios.csv --dry-run   (solo valida, no crea nada)

Salida: un CSV con email, password (la temporal generada o la dada),
rol y estado (CREADO, YA_EXISTIA o ERROR + motivo). Repártelo en privado:
con esa clave + el código de verificación del login entran directo.
"""

from __future__ import annotations

import argparse
import csv
import secrets
import string
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.schemas.auth import es_correo_institucional  # noqa: E402

ROLES_PERMITIDOS = ("administrador", "instructor", "aprendiz")
ROL_DEFECTO = "aprendiz"
LARGO_CLAVE = 12


def generar_clave() -> str:
    """Clave temporal legible (sin 0/O/1/l que se confunden)."""
    alfabeto = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789"
    return "".join(secrets.choice(alfabeto) for _ in range(LARGO_CLAVE))


def validar_fila(numero: int, email: str, password: str, rol: str) -> tuple[str, str, str] | str:
    """Devuelve (email, password, rol) limpios o el motivo del error."""
    email = (email or "").strip().lower()
    if "@" not in email or not es_correo_institucional(email):
        return f"fila {numero}: '{email}' no es correo institucional"
    password = (password or "").strip()
    if password and len(password) < 8:
        return f"fila {numero}: la clave de {email} debe tener mínimo 8 caracteres"
    rol = (rol or "").strip().lower() or ROL_DEFECTO
    if rol not in ROLES_PERMITIDOS:
        return f"fila {numero}: rol '{rol}' inválido (usa: {', '.join(ROLES_PERMITIDOS)})"
    return (email, password or generar_clave(), rol)


def leer_csv(ruta: Path) -> tuple[list[tuple[str, str, str]], list[str]]:
    """Lee y valida todo el CSV antes de crear nada."""
    validas: list[tuple[str, str, str]] = []
    errores: list[str] = []
    vistos: set[str] = set()
    with ruta.open(newline="", encoding="utf-8-sig") as f:
        for i, fila in enumerate(csv.DictReader(f), start=2):
            email_crudo = (fila.get("email") or "").strip().lower()
            if not email_crudo:
                continue
            if email_crudo in vistos:
                errores.append(f"fila {i}: '{email_crudo}' está repetido en el CSV")
                continue
            vistos.add(email_crudo)
            resultado = validar_fila(i, email_crudo, fila.get("password") or "", fila.get("rol") or "")
            if isinstance(resultado, str):
                errores.append(resultado)
            else:
                validas.append(resultado)
    return validas, errores


def importar(validas: list[tuple[str, str, str]]) -> list[dict]:
    """Crea las cuentas en Supabase. Devuelve el reporte por fila."""
    from app.config.supabase import get_supabase_client

    admin = get_supabase_client().auth.admin
    existentes = {(u.email or "").strip().lower() for u in (admin.list_users(per_page=1000) or [])}
    reporte: list[dict] = []
    for email, password, rol in validas:
        if email in existentes:
            reporte.append({"email": email, "password": "", "rol": rol, "estado": "YA_EXISTIA"})
            continue
        try:
            admin.create_user(
                {
                    "email": email,
                    "password": password,
                    "email_confirm": True,
                    "user_metadata": {"rol": rol},
                }
            )
            reporte.append({"email": email, "password": password, "rol": rol, "estado": "CREADO"})
            existentes.add(email)
        except Exception as exc:  # noqa: BLE001
            reporte.append({"email": email, "password": "", "rol": rol, "estado": f"ERROR: {exc}"})
        time.sleep(0.2)  # respira: evita saturar la API de Supabase
    return reporte


def main() -> int:
    parser = argparse.ArgumentParser(description="Importa usuarios masivos a Supabase Auth.")
    parser.add_argument("csv", type=Path, help="CSV con columnas email,password,rol")
    parser.add_argument("--salida", type=Path, default=Path("credenciales.csv"))
    parser.add_argument("--dry-run", action="store_true", help="Solo valida, no crea nada")
    args = parser.parse_args()

    if not args.csv.exists():
        print(f"No existe el archivo: {args.csv}")
        return 1
    validas, errores = leer_csv(args.csv)
    print(f"Filas válidas: {len(validas)} | Con error: {len(errores)}")
    for e in errores:
        print("  ✕", e)
    if args.dry_run:
        print("(dry-run: no se creó ninguna cuenta)")
        return 0 if validas else 1

    reporte = importar(validas)
    with args.salida.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["email", "password", "rol", "estado"])
        w.writeheader()
        w.writerows(reporte)
    creados = sum(1 for r in reporte if r["estado"] == "CREADO")
    print(f"Creados: {creados}/{len(reporte)}. Detalle en {args.salida}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
