/**
 * Pure helpers for the retrieve-sequence components: FASTA parsing/assembly and
 * the per-side flank cap. The gene → coordinate/file resolution, strand
 * reverse-complement, and flank math that used to live here now live in the
 * `sequences` microservice, so the component only needs to read and write FASTA.
 * Kept DOM-free so they can be unit-tested in isolation.
 */

/** One labelled sequence ready to render in a table cell or write to a FASTA file. */
export type FastaRecord = {
  header: string;
  sequence: string;
};

/** Sequence-type flags surfaced by the spec's radio buttons. */
export type SequenceType = 'protein' | 'cds' | 'genome';

/** Cap on per-side flank length per the spec (max 10000 bases each). */
export const MAX_FLANK_BASES = 10000;

/**
 * Wrap a single sequence to the conventional FASTA line width.
 *
 * Default 60 matches NCBI / Ensembl / `samtools faidx` output and keeps long
 * protein/CDS sequences readable when pasted into BLAST forms or text editors.
 */
export function wrapSequence(seq: string, width = 60): string {
  if (width <= 0) return seq;
  const lines: string[] = [];
  for (let i = 0; i < seq.length; i += width) {
    lines.push(seq.slice(i, i + width));
  }
  return lines.join('\n');
}

/**
 * Serialize FastaRecords into a single FASTA-formatted string.
 *
 * Trailing newline is intentional — `cat`-friendly and matches the convention
 * of FASTA writers in the wider bioinformatics ecosystem.
 */
export function formatFasta(records: FastaRecord[], wrapWidth = 60): string {
  return (
    records
      .map(
        ({header, sequence}) =>
          `>${header}\n${wrapSequence(sequence, wrapWidth)}`,
      )
      .join('\n') + (records.length > 0 ? '\n' : '')
  );
}

/**
 * Parse a FASTA-formatted string into records.
 *
 * Lenient by design: blank lines are ignored, sequence lines are concatenated
 * (line wrapping removed), and the leading `>` plus surrounding whitespace are
 * stripped from each header. Used to turn the `sequences` service's FASTA
 * response into rows for the results table.
 */
export function parseFasta(text: string): FastaRecord[] {
  const records: FastaRecord[] = [];
  let header: string | null = null;
  let sequence: string[] = [];
  const flush = () => {
    if (header !== null) records.push({header, sequence: sequence.join('')});
  };
  for (const line of text.split('\n')) {
    if (line.startsWith('>')) {
      flush();
      header = line.slice(1).trim();
      sequence = [];
    } else if (line.trim() !== '') {
      sequence.push(line.trim());
    }
  }
  flush();
  return records;
}
