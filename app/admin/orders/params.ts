/**
 * Query-string keys for the /admin/orders filters. Shared by the server page
 * (parse) and the OrdersFilters client island (build) so the param names live in
 * one place. Search + page keys come from `lib/pagination` (`q` / `page`).
 */
export const STATUS_PARAM = "status";
export const PAYMENT_PARAM = "payment";
