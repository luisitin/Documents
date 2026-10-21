/**
 * Optional host refresh for the web artifact (01-architecture.md §3 step 9; owner requirement 2,
 * "optional, lowest priority"): inside claude.ai the page MAY read
 * `cuban-immigration-tracker/data/manifest.json` from `luisitin/Documents` through the viewer's
 * GitHub connector (`claude.use("mcp")` → `callTool("GitHub", "get_file_contents", …)`). Any
 * failure leaves the shipped `./data/` files (or the bundled sample) in use, silently.
 *
 * Status: built behind a flag that is OFF. The call envelope is known (runtime contract 0.2.87,
 * `mcp.d.ts`: `use("mcp")` resolves `null` when unavailable; `callTool` rejects with `McpError`;
 * the JSON answer is `result.payload`), but the GitHub connector's `get_file_contents` RESULT
 * shape has not been observed from a real call in this build, and the page would also need the
 * `mcp` capability declared at publish time. Shipping a guessed shape is not allowed, so this
 * resolves `null` until WP10/WP11 verify the payload and declare the capability.
 * TODO(WP10/WP11): observe one real `get_file_contents` call, parse `payload` here (manifest + the
 * 7 files, zod-validated with `parseSnapshot`, sha256-checked like `fetchers.ts`), set
 * HOST_REFRESH_ENABLED = true and declare `capabilities: {mcp: {servers: [{server: "GitHub",
 * tools: ["get_file_contents"]}]}}` when publishing.
 */
import type { DataSnapshot } from './snapshot';

export const HOST_REFRESH_ENABLED = false;

export async function hostRefresh(): Promise<DataSnapshot | null> {
  if (!HOST_REFRESH_ENABLED) return null;
  return null;
}
