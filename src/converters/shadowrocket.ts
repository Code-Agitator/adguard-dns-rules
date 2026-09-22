import { Converter } from '../types';

export const shadowrocketConverter: Converter = {
  format: 'shadowrocket',
  convert(lines: string[]): string[] {
    const rules: string[] = [];
    let inRuleSection = false;

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines and metadata
      if (!trimmed || trimmed.startsWith('#!')) continue;

      // Track [Rule] section
      if (trimmed === '[Rule]') {
        inRuleSection = true;
        continue;
      }

      // Stop at other sections
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        inRuleSection = false;
        continue;
      }

      // Only process rules in [Rule] section
      if (!inRuleSection) continue;

      // Skip comments in rule section
      if (trimmed.startsWith('#')) {
        rules.push(`! ${trimmed.slice(1)}`);
        continue;
      }

      // Parse rule types
      const parts = trimmed.split(',');
      if (parts.length < 2) continue;

      const type = parts[0];
      const value = parts[1];

      switch (type) {
        case 'DOMAIN-KEYWORD':
          // Bare keyword for substring match
          rules.push(value);
          break;
        case 'DOMAIN':
        case 'DOMAIN-SUFFIX':
          // ||domain^ format
          rules.push(`||${value}^`);
          break;
        case 'IP-CIDR':
          // Skip IP rules (cannot be blocked at DNS layer)
          break;
        default:
          // Unknown rule type, skip
          break;
      }
    }

    return rules;
  }
};
