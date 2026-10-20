/**
 * Minimal typings for `sql.js@1.14.2` (the package ships none). Only the surface used by
 * `src/sources/processingTimes.ts` and the tests (03-data-pipeline.md §3.4: "Open with sql.js
 * (wasm, no native build)").
 */
declare module 'sql.js' {
  export type SqlValue = number | string | Uint8Array | null;
  export interface QueryExecResult { columns: string[]; values: SqlValue[][] }
  export interface Database {
    exec(sql: string, params?: SqlValue[]): QueryExecResult[];
    run(sql: string, params?: SqlValue[]): Database;
    export(): Uint8Array;
    close(): void;
  }
  export interface SqlJsStatic { Database: new (data?: ArrayLike<number> | Buffer | null) => Database }
  export interface InitSqlJsConfig { locateFile?: (file: string) => string }
  export default function initSqlJs(config?: InitSqlJsConfig): Promise<SqlJsStatic>;
}
