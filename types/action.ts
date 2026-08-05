/**
 * Uniform envelope returned by server actions.
 *
 * Mirrors the shape already used by app/admin/orders/actions.ts so every action
 * in the app reads the same way from the client: `{ ok, message, data? }`.
 */
export interface ActionResult<TData = unknown> {
  ok: boolean;
  message: string;
  data?: TData;
}
