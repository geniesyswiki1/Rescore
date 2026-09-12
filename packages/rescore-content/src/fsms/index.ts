import templates from "./templates.json" with { type: "json" };

export type ConditionKey = "always" | "cooks" | "cools" | "reheats" | "hot_holds" | "freezes";

export interface SafeMethodSlot {
  key: string;
  prompt: string;
  example: string;
}

export interface SafeMethodTemplate {
  id: string;
  group: string;
  title: string;
  appliesWhen: ConditionKey;
  slots: SafeMethodSlot[];
  body: string;
  check: string;
  ifItGoesWrong: string;
  neverInfer?: string;
}

export interface RecordSheet {
  id: string;
  title: string;
  frequency: string;
  columns: string[];
  perUnit?: boolean;
  perDish?: boolean;
  blankCellNote?: string;
}

export const safeMethods = templates.safeMethods as SafeMethodTemplate[];
export const recordSheets = templates.recordSheets as RecordSheet[];
export const packFooter = templates.footer;
export const conditionDescriptions = templates.conditions as Record<ConditionKey, string>;

/** A fact the operator has confirmed. Nothing renders from anything else. */
export interface ConfirmedFact {
  key: string;
  value: string;
  confirmedAt: string;
}

export type ConfirmedFacts = Record<string, ConfirmedFact>;

export interface RenderedSafeMethod {
  id: string;
  group: string;
  title: string;
  body: string;
  check: string;
  ifItGoesWrong: string;
  neverInfer?: string;
  /** Slots the operator has not confirmed yet, rendered as [CONFIRM] markers in the body. */
  missing: SafeMethodSlot[];
  complete: boolean;
}

const SLOT_PATTERN = /\{\{(\w+)\}\}/g;

/** The marker the readiness check and the operator both look for. */
export function confirmMarker(slot: SafeMethodSlot): string {
  return `[CONFIRM: ${slot.prompt}]`;
}

/**
 * Renders one safe method from confirmed facts only.
 *
 * Any slot without a confirmed fact becomes a [CONFIRM] marker carrying the question.
 * Nothing is inferred, and the example in the template is never substituted for an answer.
 */
export function renderSafeMethod(
  template: SafeMethodTemplate,
  facts: ConfirmedFacts,
): RenderedSafeMethod {
  const missing: SafeMethodSlot[] = [];

  const body = template.body.replace(SLOT_PATTERN, (_match, key: string) => {
    const slot = template.slots.find((s) => s.key === key);
    const fact = facts[key];
    if (fact && fact.value.trim() && fact.confirmedAt) {
      return fact.value.trim();
    }
    if (slot) {
      missing.push(slot);
      return confirmMarker(slot);
    }
    return `[CONFIRM: ${key}]`;
  });

  return {
    id: template.id,
    group: template.group,
    title: template.title,
    body,
    check: template.check,
    ifItGoesWrong: template.ifItGoesWrong,
    ...(template.neverInfer ? { neverInfer: template.neverInfer } : {}),
    missing,
    complete: missing.length === 0,
  };
}

/** What this kitchen does, from the intake. Decides which safe methods are in the pack. */
export interface KitchenProfile {
  cooks: boolean;
  cools: boolean;
  reheats: boolean;
  hotHolds: boolean;
  freezes: boolean;
}

export function appliesTo(template: SafeMethodTemplate, profile: KitchenProfile): boolean {
  switch (template.appliesWhen) {
    case "always":
      return true;
    case "cooks":
      return profile.cooks;
    case "cools":
      return profile.cools;
    case "reheats":
      return profile.reheats;
    case "hot_holds":
      return profile.hotHolds;
    case "freezes":
      return profile.freezes;
    default:
      return false;
  }
}

export interface RenderedPack {
  businessName: string;
  generatedOn: string;
  safeMethods: RenderedSafeMethod[];
  recordSheets: RecordSheet[];
  footer: string;
  /** Every slot still unconfirmed, across the whole pack. */
  confirmations: Array<{ methodId: string; methodTitle: string; slot: SafeMethodSlot }>;
  complete: boolean;
}

/**
 * Builds the whole food safety management pack for one kitchen.
 *
 * The pack is always generated, complete or not. An incomplete pack shows the operator
 * exactly which questions are still open, which is the point of the confirm prompts.
 */
export function renderPack(input: {
  businessName: string;
  generatedOn: string;
  profile: KitchenProfile;
  facts: ConfirmedFacts;
}): RenderedPack {
  const applicable = safeMethods.filter((m) => appliesTo(m, input.profile));
  const rendered = applicable.map((m) => renderSafeMethod(m, input.facts));

  const confirmations = rendered.flatMap((method) =>
    method.missing.map((slot) => ({ methodId: method.id, methodTitle: method.title, slot })),
  );

  return {
    businessName: input.businessName,
    generatedOn: input.generatedOn,
    safeMethods: rendered,
    recordSheets,
    footer: packFooter,
    confirmations,
    complete: confirmations.length === 0,
  };
}

/** Every question the operator still has to answer, in the order the pack asks them. */
export function confirmPrompts(pack: RenderedPack): string[] {
  return pack.confirmations.map(({ slot }) => slot.prompt);
}

export interface GenericityFinding {
  methodId: string;
  methodTitle: string;
  reason: string;
}

/**
 * Flags safe methods that read like a blank template.
 *
 * A safe method passes only where it names something in this kitchen: a unit, a dish, a
 * person or a product the operator confirmed. Spec 3.6 calls this the genericity check.
 */
export function genericityCheck(pack: RenderedPack, namedThings: string[]): GenericityFinding[] {
  const names = namedThings.map((n) => n.trim().toLowerCase()).filter(Boolean);

  return pack.safeMethods.flatMap((method) => {
    if (!method.complete) {
      return [
        {
          methodId: method.id,
          methodTitle: method.title,
          reason: `${method.missing.length} fact${method.missing.length === 1 ? "" : "s"} still to confirm, so this method does not yet describe your kitchen.`,
        },
      ];
    }
    const body = method.body.toLowerCase();
    const namesSomething = names.some((name) => body.includes(name));
    if (!namesSomething) {
      return [
        {
          methodId: method.id,
          methodTitle: method.title,
          reason: "This method does not name any of your own equipment, dishes or people, so an officer will read it as a generic pack.",
        },
      ];
    }
    return [];
  });
}
