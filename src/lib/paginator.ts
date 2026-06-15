import type { UUID } from "../types/index.js";

export type PageFetcher<T> = (cursor?: UUID) => Promise<{
  items: T[];
  page: { nextPage?: UUID; previousPage?: UUID };
}>;

export async function* paginate<T>(
  fetcher: PageFetcher<T>,
  opts: { limit?: number } = {},
): AsyncGenerator<T[], void, unknown> {
  let cursor: UUID | undefined;
  let count = 0;

  // `true` is intentional — all exits are via break
  for (;;) {
    const result = await fetcher(cursor);
    const { items } = result;

    if (items.length === 0) break;
    yield items;

    count += items.length;
    const maxItems = opts.limit;
    if (maxItems !== undefined && count >= maxItems) break;

    const nextCursor = result.page.nextPage;
    if (!nextCursor) break;
    cursor = nextCursor;
  }
}

export async function collectAll<T>(
  fetcher: PageFetcher<T>,
  maxItems?: number,
): Promise<T[]> {
  const all: T[] = [];
  const limit = maxItems;
  for await (const page of paginate(
    fetcher,
    limit !== undefined ? { limit } : {},
  )) {
    all.push(...page);
    if (limit !== undefined && all.length >= limit) break;
  }
  return limit !== undefined ? all.slice(0, limit) : all;
}
