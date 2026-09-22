export interface SourceItem {
  name: string;
  url?: string;
  path?: string;
  output: string;
}

export interface SourceFile {
  format: string;
  sources: SourceItem[];
}

export interface SourceConfig extends SourceItem {
  converter: string;
}

export interface Converter {
  format: string;
  convert(lines: string[]): string[];
}

export interface BuildOptions {
  sourcesDir: string;
  outputDir: string;
}
