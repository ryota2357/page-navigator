// Canonical string form. Examples:
//   "j", "J", "?"            — bare printable; Shift folds into case
//   "<C-j>"                  — Ctrl+j; printable lowercased
//   "<C-S-j>"                — Ctrl+Shift+j; explicit <S-> when paired
//                              with another modifier
//   "<S-Tab>", "<C-S-Tab>"   — non-printable: Shift always kept as modifier
//
// Modifier letters uppercase, modifier order alphabetical A-C-M-S,
// non-printable key names UpperCamelCase. The parser inside <…> is
// case-insensitive for both modifiers and printable letters (so `<C-J>`
// canonicalises to `<C-j>`); the serializer always emits canonical form.
export type KeyToken = string;
export type Trigger = KeyToken[];
