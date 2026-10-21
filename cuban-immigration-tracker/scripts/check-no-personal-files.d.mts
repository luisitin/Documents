/** Types for scripts/check-no-personal-files.mjs (WP11), so strict TS tests can import it. */
export interface Finding {
  path: string;
  reason: string;
}
export declare const PROJECT: string;
export declare const ALLOWED_DIRS: readonly string[];
export declare const SCREENSHOT_DIR: string;
export declare const BLOCKED_EXTENSIONS: readonly string[];
export declare const KNOWN_OWNER_FILES: readonly string[];
export declare const RECEIPT_RE: RegExp;
export declare const RECEIPT_ALLOWLIST: readonly string[];
export declare const RECEIPT_PREFIXES: readonly string[];
export declare function classifyPaths(paths: readonly string[]): { violations: Finding[]; warnings: Finding[] };
export declare function findReceipts(text: string): string[];
export declare function maskReceipt(v: string): string;
