import { useState } from "react";
import type { ReactNode } from "react";
import { Card, Field, PrimaryButton, Select, TextArea, TextInput } from "./ui";

export interface FieldDef {
  key: string;
  label: string;
  required?: boolean;
  type?: "text" | "number" | "textarea" | "select";
  options?: string[];
  placeholder?: string;
  maxLength?: string | number;
  hint?: string;
}

export type FormValues = Record<string, string>;

/** Formulario crear/editar + lista, espejo de conectarForm + cargarTodo del panel anterior. */
export default function CrudSection<T extends { id: number }>({
  id,
  icon,
  title,
  sub,
  fields,
  items,
  values,
  onValues,
  editing,
  submitNew,
  submitEdit,
  emptyText,
  msg,
  renderItem,
  renderRow,
  tableHead,
  onSubmit,
  onCancel,
  onEdit,
  onDelete,
}: {
  id: string;
  icon: ReactNode;
  title: string;
  sub: string;
  fields: FieldDef[];
  items: T[];
  values: FormValues;
  onValues: (v: FormValues) => void;
  editing: boolean;
  submitNew: string;
  submitEdit: string;
  emptyText: string;
  msg: string;
  renderItem?: (item: T, acc: { onEdit: () => void; onDelete: () => void }) => ReactNode;
  renderRow?: (item: T, acc: { onEdit: () => void; onDelete: () => void }) => ReactNode;
  tableHead?: string[];
  onSubmit: () => Promise<void>;
  onCancel: () => void;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
}) {
  const [enviando, setEnviando] = useState(false);

  function set(k: string, v: string) {
    onValues({ ...values, [k]: v });
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    try {
      await onSubmit();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Card>
      <div className="mb-4 flex items-start gap-3" id={id}>
        <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-xl border border-neon/15 bg-neon/[0.08] text-neon">
          {icon}
        </span>
        <div>
          <h3 className="text-[17px] font-extrabold text-ink">{title}</h3>
          <p className="mt-1 text-[10px] text-muted">{sub}</p>
        </div>
      </div>

      <form onSubmit={enviar} className="mb-4 grid gap-4">
        {fields.map((f) => (
          <Field key={f.key} label={f.label} required={f.required} hint={f.hint}>
            {f.type === "textarea" ? (
              <TextArea
                value={values[f.key] ?? ""}
                onChange={(e) => set(f.key, e.target.value)}
                placeholder={f.placeholder}
                maxLength={f.maxLength as number | undefined}
                required={f.required}
              />
            ) : f.type === "select" && f.options ? (
              <Select
                value={values[f.key] ?? ""}
                onChange={(e) => set(f.key, e.target.value)}
                required={f.required}
              >
                <option value="">Selecciona…</option>
                {f.options.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </Select>
            ) : (
              <TextInput
                type={f.type === "number" ? "number" : "text"}
                value={values[f.key] ?? ""}
                onChange={(e) => set(f.key, e.target.value)}
                placeholder={f.placeholder}
                maxLength={f.maxLength as number | undefined}
                required={f.required}
              />
            )}
          </Field>
        ))}
        <PrimaryButton type="submit" disabled={enviando} className="w-full disabled:opacity-60">
          {enviando ? "Guardando…" : editing ? submitEdit : submitNew}
        </PrimaryButton>
        {editing && (
          <button
            type="button"
            onClick={onCancel}
            className="w-full rounded-[12px] border border-line bg-transparent py-[10px] text-[13px] font-semibold text-muted transition-colors hover:bg-white/5 hover:text-ink"
          >
            Cancelar edición
          </button>
        )}
      </form>

      {msg && (
        <p role="status" className="mb-2 min-h-[1.2em] text-[13px] text-neon">
          {msg}
        </p>
      )}

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-white/[0.02] p-6 text-center text-[13px] text-muted">
          {emptyText}
        </p>
      ) : tableHead && renderRow ? (
        <div className="overflow-auto rounded-[13px] border border-neon/10">
          <table className="w-full min-w-[420px] border-collapse">
            <thead className="bg-neon/[0.045]">
              <tr>
                {tableHead.map((h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap px-[14px] py-[13px] text-left text-[9px] font-bold tracking-[0.4px] text-muted"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-t border-neon/[0.075]">
                  {renderRow(it, {
                    onEdit: () => onEdit(it),
                    onDelete: () => onDelete(it),
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ul className="grid gap-2">
          {items.map((it) => (
            <li
              key={it.id}
              className="grid gap-1 rounded-[10px] border border-line bg-white/[0.02] p-3 text-[14px]"
            >
              {renderItem?.(it, {
                onEdit: () => onEdit(it),
                onDelete: () => onDelete(it),
              })}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/** Botones ✎/× de cada tarjeta (como los mini-btn del panel anterior). */
export function ItemActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex gap-1.5">
      <button
        type="button"
        onClick={onEdit}
        title="Editar"
        aria-label="Editar"
        className="grid h-[30px] w-[30px] place-items-center rounded-lg border border-line bg-transparent text-[13px] text-muted transition-colors hover:border-neon/50 hover:bg-neon/10 hover:text-neon"
      >
        ✎
      </button>
      <button
        type="button"
        onClick={onDelete}
        title="Eliminar"
        aria-label="Eliminar"
        className="grid h-[30px] w-[30px] place-items-center rounded-lg border border-line bg-transparent text-[13px] text-muted transition-colors hover:border-danger/50 hover:bg-danger/10 hover:text-danger"
      >
        ×
      </button>
    </div>
  );
}
