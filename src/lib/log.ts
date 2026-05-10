// Logging discipline (docs/dev/step-02-data-model.md §10 S6):
// keystrokes are PII-shaped (passwords mistyped outside <input>s land as
// keydowns we observe). Logs may carry bindingId / actionId / scope / depth /
// timing — never raw KeyToken values or event.key content. Use category
// redactions like "<printable>" / "<sequence-prefix>" if a key category must
// be logged.

const PREFIX = "[page-navigator]";

export const log = {
  debug: (msg: string, meta?: Record<string, unknown>) => {
    console.debug(PREFIX, msg, meta ?? "");
  },
  info: (msg: string, meta?: Record<string, unknown>) => {
    console.info(PREFIX, msg, meta ?? "");
  },
  warn: (msg: string, meta?: Record<string, unknown>) => {
    console.warn(PREFIX, msg, meta ?? "");
  },
  error: (msg: string, meta?: Record<string, unknown>) => {
    console.error(PREFIX, msg, meta ?? "");
  },
};
