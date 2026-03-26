/**
 * Triggers a browser download of the given content as a file.
 *
 * @param content - The file content as a string.
 * @param filename - The name of the file to download.
 * @param mimeType - The MIME type of the file.
 */
export function triggerBrowserDownload(
  content: string,
  filename: string,
  mimeType: string,
): void {
  const blob = new Blob([content], {type: mimeType});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Downloads tabular data as a TSV (tab-separated values) file.
 *
 * @param data - Array of objects representing rows of data.
 * @param attributes - Array of attribute names defining column order.
 * @param headers - Object mapping attribute names to display headers.
 * @param filename - The name of the file to download (default: 'data.tsv').
 *
 * @example
 * ```typescript
 * const data = [
 *   { name: 'Gene1', description: 'A gene' },
 *   { name: 'Gene2', description: 'Another gene' },
 * ];
 * const attributes = ['name', 'description'];
 * const headers = { name: 'Name', description: 'Description' };
 * downloadTableAsTSV(data, attributes, headers, 'genes.tsv');
 * ```
 */
export function downloadTableAsTSV(
  data: Record<string, unknown>[],
  attributes: string[],
  headers: Record<string, string>,
  filename: string = 'data.tsv',
): void {
  const headerRow = attributes.map((attr) => headers[attr] || attr);
  const rows = data.map((row) =>
    attributes.map((attr) => {
      const value = row[attr];
      if (value === null || value === undefined) {
        return '';
      }
      // Escape tabs and newlines in values
      return String(value).replace(/\t/g, ' ').replace(/\n/g, ' ');
    }),
  );

  const content = [headerRow, ...rows].map((r) => r.join('\t')).join('\n');
  triggerBrowserDownload(content, filename, 'text/tab-separated-values');
}
