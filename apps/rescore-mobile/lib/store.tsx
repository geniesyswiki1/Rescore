import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AreaScores } from "@rescore/content/scoring";
import type { Classification, ClassifiedItem } from "./api";

const STORAGE_KEY = "rescore.cases.v1";

export type ItemStatus = "open" | "done_needs_evidence" | "evidenced" | "mismatch";

export interface Evidence {
  uri: string;
  /** Stamped when the photo is taken, so the evidence carries a date without the operator adding one. */
  capturedAt: string;
  note: string | null;
}

export interface PlanItem {
  id: string;
  originalText: string;
  area: ClassifiedItem["area"];
  taxonomyId: string | null;
  legalBasis: string | null;
  status: ItemStatus;
  evidence: Evidence[];
  doneAt: string | null;
}

export interface ConfirmedFact {
  key: string;
  value: string;
  confirmedAt: string;
}

export interface KitchenProfileState {
  cooks: boolean;
  cools: boolean;
  reheats: boolean;
  hotHolds: boolean;
  freezes: boolean;
}

export interface Case {
  id: string;
  businessName: string;
  createdAt: string;
  reportText: string;
  scoresBefore: AreaScores | null;
  ratingBefore: number | null;
  scoresAreStated: boolean;
  hardStops: Array<{ id: string; original_text: string }>;
  outOfScope: string | null;
  paid: boolean;
  profile: KitchenProfileState;
  items: PlanItem[];
  facts: Record<string, ConfirmedFact>;
  outcome: { status: "waiting" | "rated" | "more_items"; ratingAfter: number | null } | null;
}

interface StoreValue {
  cases: Case[];
  current: Case | null;
  loading: boolean;
  startCase(input: { reportText: string; classification: Classification }): Promise<Case>;
  openCase(id: string): void;
  update(id: string, change: (previous: Case) => Case): Promise<void>;
  removeCase(id: string): Promise<void>;
}

const StoreContext = createContext<StoreValue | null>(null);

const emptyProfile: KitchenProfileState = {
  cooks: true,
  cools: true,
  reheats: true,
  hotHolds: true,
  freezes: true,
};

function toScores(classification: Classification): AreaScores | null {
  const s = classification.scores_before;
  if (s.hygiene === null || s.structure === null || s.confidence === null) return null;
  return { hygiene: s.hygiene, structure: s.structure, confidence: s.confidence };
}

export function CaseStoreProvider({ children }: { children: React.ReactNode }) {
  const [cases, setCases] = useState<Case[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setCases(JSON.parse(raw) as Case[]);
      } catch {
        // A corrupt store is not worth losing the app over; start clean.
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = useCallback(async (next: Case[]) => {
    setCases(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const startCase = useCallback<StoreValue["startCase"]>(
    async ({ reportText, classification }) => {
      const now = new Date().toISOString();
      const created: Case = {
        id: `case_${Date.now()}`,
        businessName: "",
        createdAt: now,
        reportText,
        scoresBefore: toScores(classification),
        ratingBefore: classification.rating_before,
        scoresAreStated: classification.scores_are_stated,
        hardStops: classification.hard_stops ?? [],
        outOfScope: classification.out_of_scope,
        paid: false,
        profile: emptyProfile,
        items: classification.items.map((item, index) => ({
          id: `item_${index}`,
          originalText: item.original_text,
          area: item.area,
          taxonomyId: item.taxonomy_id,
          legalBasis: item.legal_basis,
          status: "open",
          evidence: [],
          doneAt: null,
        })),
        facts: {},
        outcome: null,
      };
      await persist([created, ...cases]);
      setCurrentId(created.id);
      return created;
    },
    [cases, persist],
  );

  const update = useCallback<StoreValue["update"]>(
    async (id, change) => {
      await persist(cases.map((entry) => (entry.id === id ? change(entry) : entry)));
    },
    [cases, persist],
  );

  const removeCase = useCallback<StoreValue["removeCase"]>(
    async (id) => {
      await persist(cases.filter((entry) => entry.id !== id));
      setCurrentId((previous) => (previous === id ? null : previous));
    },
    [cases, persist],
  );

  const value = useMemo<StoreValue>(
    () => ({
      cases,
      current: cases.find((entry) => entry.id === currentId) ?? cases[0] ?? null,
      loading,
      startCase,
      openCase: setCurrentId,
      update,
      removeCase,
    }),
    [cases, currentId, loading, startCase, update, removeCase],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useCases(): StoreValue {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useCases must be used inside CaseStoreProvider");
  return value;
}

/** How far through the plan the operator is. */
export function progress(current: Case): { open: number; evidenced: number; total: number; ready: boolean } {
  const total = current.items.length;
  const evidenced = current.items.filter((item) => item.status === "evidenced").length;
  const open = total - evidenced;
  return { open, evidenced, total, ready: total > 0 && open === 0 };
}
