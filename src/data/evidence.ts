export interface Evidence {
  id: string;
  fileName: string;
  fileType: string;
  fileData: string;
  description: string;
  createdAt: string;
}

export function loadEvidence(): Evidence[] {
  try {
    const stored = localStorage.getItem("sena_evidence");
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

export function saveEvidence(evidence: Evidence[]): void {
  localStorage.setItem("sena_evidence", JSON.stringify(evidence));
}