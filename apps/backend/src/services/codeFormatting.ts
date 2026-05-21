const CODE_GROUP_SIZE = 4;

export function unformatCode(code: string): string {
  return code.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

export function formatCode(code: string): string {
  const raw = unformatCode(code).slice(0, 12);
  return raw.match(new RegExp(`.{1,${CODE_GROUP_SIZE}}`, "g"))?.join("-") ?? raw;
}
