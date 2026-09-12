import { fsaAttribution } from "@rescore/content/scoring";

/** Required on every page that shows data derived from the FSA, per spec 4.6. */
export function Attribution() {
  return <p className="attribution">{fsaAttribution}</p>;
}
