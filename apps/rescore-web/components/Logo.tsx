/** The word, then the three scored areas as bars. Only the home page animates them. */
export function Logo({ animate = false }: { animate?: boolean }) {
  return (
    <span className={`logo${animate ? " logo-animate" : ""}`}>
      rescore
      <span className="logo-bars" aria-hidden="true">
        <span className={`logo-bar${animate ? "" : " filled"}`} />
        <span className={`logo-bar${animate ? "" : " filled"}`} />
        <span className={`logo-bar${animate ? "" : " filled"}`} />
      </span>
    </span>
  );
}
