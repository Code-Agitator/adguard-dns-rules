export function deduplicate(rules: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const rule of rules) {
    const key = rule.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(rule);
    }
  }

  return result;
}
