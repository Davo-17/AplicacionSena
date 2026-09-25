"""Pruebas del importador masivo (solo validación local, sin red)."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))

from importar_usuarios import generar_clave, validar_fila


def test_clave_temporal_segura() -> None:
    clave = generar_clave()
    assert len(clave) == 12
    assert not set(clave) & set("0O1l")


def test_fila_valida_completa_defaults() -> None:
    email, clave, rol = validar_fila(2, "a@soy.sena.edu.co", "", "")
    assert (email, rol) == ("a@soy.sena.edu.co", "aprendiz")
    assert len(clave) == 12


def test_fila_rechaza_dominio_clave_y_rol() -> None:
    assert isinstance(validar_fila(2, "a@gmail.com", "", ""), str)
    assert isinstance(validar_fila(2, "a@sena.edu.co", "corta", ""), str)
    assert isinstance(validar_fila(2, "a@sena.edu.co", "", "jefe"), str)
