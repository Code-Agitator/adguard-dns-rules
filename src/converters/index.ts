import { Converter } from '../types';
import { shadowrocketConverter } from './shadowrocket';

const converters: Record<string, Converter> = {
  shadowrocket: shadowrocketConverter
};

export function getConverter(name: string): Converter {
  const converter = converters[name];
  if (!converter) {
    throw new Error(`Unknown converter: ${name}`);
  }
  return converter;
}

export function registerConverter(converter: Converter): void {
  converters[converter.format] = converter;
}
