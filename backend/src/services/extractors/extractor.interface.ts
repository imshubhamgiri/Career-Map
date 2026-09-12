export interface Extractor<T = string | Buffer> {
  extract(source: T): Promise<string[]>;
}
