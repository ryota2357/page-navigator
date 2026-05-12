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
