/**
 * Lightweight helper to calculate the next sequential certificate registration number.
 * Kept strictly independent from jsPDF / canvas to prevent bundling heavy PDF libraries into the critical path.
 */
export function generateNextCertificateNumber(
  docType: 'diplom' | 'sertifikat' = 'diplom',
  existingCertificates: Array<{ certificateNumber?: string; documentType?: string }> = [],
  offset: number = 0
): string {
  const isDiplom = docType === 'diplom';
  const prefix = isDiplom ? 'DIP-2026-' : 'CERT-2026-';
  const usedNumbers = new Set<string>();

  // Maintain separate sequence counters for DIP and CERT
  let maxNumeric = 1000;
  const prefixRegex = isDiplom ? /^DIP-2026-(\d+)$/i : /^CERT-2026-(\d+)$/i;

  if (Array.isArray(existingCertificates)) {
    for (const c of existingCertificates) {
      if (!c || !c.certificateNumber) continue;
      const clean = c.certificateNumber.trim().toUpperCase();
      usedNumbers.add(clean);

      // Scan ONLY numbers matching the current document type prefix
      const match = clean.match(prefixRegex);
      if (match) {
        const val = parseInt(match[1], 10);
        // Exclude huge out-of-range epoch millisecond numbers like 822661
        if (!isNaN(val) && val > maxNumeric && val < 90000) {
          maxNumeric = val;
        }
      }
    }
  }

  let candidate = maxNumeric + 1 + offset;
  while (usedNumbers.has(`${prefix}${candidate}`.toUpperCase())) {
    candidate++;
  }

  return `${prefix}${candidate}`;
}
