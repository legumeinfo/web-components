/**
 * Pure helpers for the retrieve-sequence components: full-yuck prefix extraction,
 * strand-aware flank coordinate math, nucleotide reverse-complement, and FASTA
 * assembly. Kept DOM-free so they can be unit-tested in isolation.
 */

/** One labelled sequence ready to render in a table cell or write to a FASTA file. */
export type FastaRecord = {
  header: string;
  sequence: string;
};

/** Sequence-type flags surfaced by the spec's checkboxes. */
export type SequenceType = 'protein' | 'cds' | 'genome';

/** Cap on per-side flank length per the spec (max 10000 bases each). */
export const MAX_FLANK_BASES = 10000;

/**
 * Pull the LIS full-yuck annotation prefix out of a gene ID.
 *
 * LIS gene IDs are structurally `{gensp}.{infraspecies}.{gnm}.{ann}.{gene-suffix}`,
 * so the first four dot-separated tokens are the prefix dscensor indexes on. Doing
 * this client-side avoids a second dscensor round-trip just to discover the prefix.
 */
export function extractFullYuckPrefix(geneId: string): string {
  const parts = geneId.split('.');
  if (parts.length < 5) {
    throw new Error(
      `Gene ID "${geneId}" is not in the expected ` +
        `gensp.infraspecies.gnm<N>.ann<N>.<suffix> shape.`,
    );
  }
  return parts.slice(0, 4).join('.');
}

/**
 * Coerce a user-typed flank value to an integer in [0, MAX_FLANK_BASES].
 *
 * The spec caps each side at 10000 bp; rather than throwing on out-of-range input
 * we silently clamp so the UI matches the "max 10000 bases" caption.
 */
export function clampFlank(value: number | string | null | undefined): number {
  const n = typeof value === 'number' ? value : Number(value ?? 0);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(Math.floor(n), MAX_FLANK_BASES);
}

/**
 * Region to actually fetch from the genome FASTA, given the gene's coordinates
 * and the user's requested ±flank budget.
 *
 * For minus-strand genes the spec's "upstream" sits at the high-coordinate end
 * (3' on plus strand) and "downstream" sits at the low-coordinate end, so we
 * swap the budgets before applying to start/end. Start is clamped at 0 because
 * pysam half-open BED coords don't go negative.
 */
export function computeFlankRegion(
  start: number,
  end: number,
  strand: string,
  upstreamBases: number,
  downstreamBases: number,
): {fetchStart: number; fetchEnd: number} {
  const up = clampFlank(upstreamBases);
  const down = clampFlank(downstreamBases);
  const negative = strand === '-';
  const leftBudget = negative ? down : up;
  const rightBudget = negative ? up : down;
  return {
    fetchStart: Math.max(0, start - leftBudget),
    fetchEnd: end + rightBudget,
  };
}

/**
 * Standard IUPAC nucleotide reverse-complement.
 *
 * ds_utilities is strand-agnostic by design (see backend-side memory
 * `retrieve-sequence-strandedness-out-of-scope`), so flipping minus-strand
 * genomic slices is the web component's responsibility. We preserve case so
 * downstream tooling can still distinguish soft-masked bases.
 */
export function reverseComplement(seq: string): string {
  const complement: Record<string, string> = {
    A: 'T',
    T: 'A',
    G: 'C',
    C: 'G',
    U: 'A',
    R: 'Y',
    Y: 'R',
    S: 'S',
    W: 'W',
    K: 'M',
    M: 'K',
    B: 'V',
    V: 'B',
    D: 'H',
    H: 'D',
    N: 'N',
    a: 't',
    t: 'a',
    g: 'c',
    c: 'g',
    u: 'a',
    r: 'y',
    y: 'r',
    s: 's',
    w: 'w',
    k: 'm',
    m: 'k',
    b: 'v',
    v: 'b',
    d: 'h',
    h: 'd',
    n: 'n',
  };
  let result = '';
  for (let i = seq.length - 1; i >= 0; i--) {
    const base = seq[i];
    result += complement[base] ?? base;
  }
  return result;
}

/**
 * Wrap a single sequence to the conventional FASTA line width.
 *
 * Default 60 matches NCBI / Ensembl output and keeps long protein/CDS sequences
 * readable when pasted into BLAST forms or text editors.
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
