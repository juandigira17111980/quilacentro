type ClientErrorDetail = {
  error: unknown;
  context: Record<string, unknown>;
};

declare global {
  interface WindowEventMap {
    "mercanta:error": CustomEvent<ClientErrorDetail>;
  }
}

export function reportClientError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<ClientErrorDetail>("mercanta:error", {
      detail: { error, context: { route: window.location.pathname, ...context } },
    }),
  );
}
