import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { SourceConfig } from '../types';

interface RawSource {
  name?: string;
  url?: string;
  path?: string;
  output?: string;
}

function parseYaml(content: string): { format: string; sources: RawSource[] } {
  const lines = content.split('\n');
  let format = '';
  const sources: RawSource[] = [];
  let current: RawSource | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Top level format
    if (trimmed.startsWith('format:')) {
      format = trimmed.split(':').slice(1).join(':').trim();
      continue;
    }

    // Array item marker
    if (trimmed === 'sources:' || trimmed.startsWith('- ')) {
      if (trimmed.startsWith('- ')) {
        // New source item
        if (current) sources.push(current);
        current = {};
        
        // Parse inline properties after -
        const rest = trimmed.slice(2).trim();
        if (rest.includes(':')) {
          const [key, ...valueParts] = rest.split(':');
          const value = valueParts.join(':').trim();
          if (key && value) {
            (current as any)[key.trim()] = value;
          }
        }
      }
      continue;
    }

    // Property line (indented under a source)
    if (current && trimmed.includes(':')) {
      const [key, ...valueParts] = trimmed.split(':');
      const value = valueParts.join(':').trim();
      if (key && value) {
        (current as any)[key.trim()] = value;
      }
    }
  }

  if (current) sources.push(current);

  return { format, sources };
}

export function loadSources(sourcesDir: string): SourceConfig[] {
  const files = readdirSync(sourcesDir).filter(f => f.endsWith('.yaml'));
  const allSources: SourceConfig[] = [];

  for (const f of files) {
    const content = readFileSync(join(sourcesDir, f), 'utf-8');
    const { format, sources } = parseYaml(content);

    for (const source of sources) {
      if (!source.name) continue;
      allSources.push({
        name: source.name,
        url: source.url,
        path: source.path,
        output: source.output || 'output.txt',
        converter: format
      });
    }
  }

  return allSources;
}
