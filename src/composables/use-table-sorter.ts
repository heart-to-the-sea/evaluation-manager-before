import { h, reactive } from 'vue';

type SortOrder = 'ascend' | 'descend' | false;

interface SortState {
  columnKey?: string | number;
  order?: SortOrder;
}

interface UseTableSorterOptions {
  fieldMap?: Record<string, string>;
}

interface ActiveSorter {
  columnKey: string;
  order: Exclude<SortOrder, false>;
}

function normalizeOrder(order?: SortOrder | null): Exclude<SortOrder, false> | null {
  if (order === 'ascend' || order === 'descend') {
    return order;
  }
  return null;
}

export function useTableSorter(onChange?: () => void, options: UseTableSorterOptions = {}) {
  const sorterState = reactive<{
    sorters: ActiveSorter[];
  }>({
    sorters: []
  });

  function resolveField(columnKey?: string | number) {
    const key = columnKey == null ? '' : String(columnKey);
    return options.fieldMap?.[key] || key;
  }

  function normalizeSorters(sorter: SortState | SortState[] | null) {
    const sorters = (Array.isArray(sorter) ? sorter : sorter ? [sorter] : [])
      .map(item => {
        const order = normalizeOrder(item?.order);
        if (!order) {
          return null;
        }

        const columnKey = resolveField(item?.columnKey);
        if (!columnKey) {
          return null;
        }

        return {
          columnKey,
          order
        } satisfies ActiveSorter;
      })
      .filter((item): item is ActiveSorter => Boolean(item));

    const deduplicated = new Map<string, ActiveSorter>();
    sorters.forEach(item => deduplicated.set(item.columnKey, item));
    return Array.from(deduplicated.values());
  }

  function handleSorter(sorter: SortState | SortState[] | null) {
    sorterState.sorters = normalizeSorters(sorter);
    onChange?.();
  }

  function getSortOrder(columnKey: string) {
    const resolvedField = resolveField(columnKey);
    return sorterState.sorters.find(item => item.columnKey === resolvedField)?.order || false;
  }

  function getSortPriority(columnKey: string) {
    const resolvedField = resolveField(columnKey);
    const index = sorterState.sorters.findIndex(item => item.columnKey === resolvedField);
    return index >= 0 ? index + 1 : 0;
  }

  function appendSorter<T extends Record<string, any>>(payload: T): T & { sortField?: string; sortOrder?: string } {
    if (!sorterState.sorters.length) {
      return payload;
    }

    return {
      ...payload,
      sortField: sorterState.sorters.map(item => item.columnKey).join(','),
      sortOrder: sorterState.sorters.map(item => item.order.replace('end', '')).join(',')
    };
  }

  function createSorter(multiple = 1) {
    return {
      multiple
    };
  }

  function createSorterRender(columnKey: string) {
    return ({ order }: { order: SortOrder }) => {
      const priority = getSortPriority(columnKey);
      const active = order === 'ascend' || order === 'descend';
      const symbol = order === 'ascend' ? '↑' : order === 'descend' ? '↓' : '-';

      return h(
        'span',
        {
          style: {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            minWidth: active ? '18px' : '12px',
            lineHeight: '1',
            fontSize: '12px',
            fontWeight: '600',
            color: active ? 'var(--em-primary-color)' : 'var(--n-text-color-3)'
          }
        },
        [
          h('span', symbol),
          active && priority
            ? h(
                'span',
                {
                  style: {
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '14px',
                    height: '14px',
                    padding: '0 3px',
                    borderRadius: '999px',
                    backgroundColor: 'rgb(var(--em-primary-color-rgb) / 0.12)',
                    color: 'var(--em-primary-color)',
                    fontSize: '10px',
                    fontWeight: '700'
                  }
                },
                String(priority)
              )
            : null
        ]
      );
    };
  }

  function resetSorter() {
    sorterState.sorters = [];
  }

  return {
    sorterState,
    handleSorter,
    getSortOrder,
    getSortPriority,
    appendSorter,
    createSorter,
    createSorterRender,
    resetSorter
  };
}
