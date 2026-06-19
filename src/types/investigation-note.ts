export interface StoredInvestigationNote {
  id: string;
  claimId: string;
  body: string;
  createdAt: string;
  linkedEventId?: string;
}

/** UI-facing note shape (maps from StoredInvestigationNote) */
export interface InvestigationNote {
  id: string;
  content: string;
  createdAt: string;
  claimId?: string;
  linkedEventId?: string;
}

export function toInvestigationNote(stored: StoredInvestigationNote): InvestigationNote {
  return {
    id: stored.id,
    claimId: stored.claimId,
    content: stored.body,
    createdAt: stored.createdAt,
    linkedEventId: stored.linkedEventId,
  };
}

export function fromInvestigationNote(
  note: InvestigationNote,
  claimId: string
): StoredInvestigationNote {
  return {
    id: note.id,
    claimId: note.claimId ?? claimId,
    body: note.content,
    createdAt: note.createdAt,
    linkedEventId: note.linkedEventId,
  };
}
