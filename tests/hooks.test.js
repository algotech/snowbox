import { renderHook, act } from '@testing-library/react-hooks';

import { useList } from '../src/hooks';
import Response from '../src/Response';

let items = [];
let pageSize = 2;

const options = {
  idField: 'id',
  entityPath: 'data',
  entitiesPath: 'data',
  entitiesFieldName: 'data',
  hasMeta: true,
  metaPath: '',
  metaFieldName: 'meta',
};

const fetchImplementation = ({ page }) => Promise.resolve(new Response({
  data: items.slice((page - 1) * pageSize, page * pageSize),
  total: items.length,
}, options, true));
const upsertImplementation = (item) => new Promise((resolve) => {
  items.push(item);

  resolve(new Response({ ok: true, data: { hm: true } }, options));
});
const removeImplementation = ({ index }) => new Promise((resolve) => {
  items.splice(index, 1);

  resolve(new Response({}, options));
});

describe('hooks', () => {
  describe('useList', () => {
    const entity = {
      key: 'tests',
      provider: {
        fetch: jest.fn(fetchImplementation),
        upsert: jest.fn(upsertImplementation),
        remove: jest.fn(removeImplementation),
      },
    };

    beforeEach(() => {
      items = [
        { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 },
      ];
    });

    it('returns an object', async () => {
      const { result, waitForNextUpdate } = renderHook(() => useList(entity));

      expect(typeof result.current).toBe('object');
      expect(result.current.items).toEqual([]);
      expect(typeof result.current.meta).toBe('object');
      expect(result.current.status).toEqual('pending');
      expect(typeof result.current.setFilters).toBe('function');
      expect(typeof result.current.upsert).toBe('function');
      expect(typeof result.current.remove).toBe('function');

      await waitForNextUpdate();
    });

    it('loads the first page when the component is mounted', async () => {
      const { result, waitForNextUpdate } = renderHook(() =>
        useList(entity, { page: 1 })
      );

      expect(result.current.items).toEqual([]);
      expect(result.current.status).toEqual('pending');

      await waitForNextUpdate();

      expect(result.current.items).toEqual([{ id: 1 }, { id: 2 }]);
      expect(result.current.status).toEqual('succeeded');
    });

    it('loads a new page when the filters change', async () => {
      const { result, waitForNextUpdate } = renderHook(() =>
        useList(entity, { page: 1 })
      );

      await waitForNextUpdate();

      expect(result.current.items).toEqual([{ id: 1 }, { id: 2 }]);
      expect(result.current.meta).toEqual({ total: 6 });
      expect(result.current.status).toEqual('succeeded');

      act(() => result.current.setFilters({ page: 2 }));

      expect(result.current.prevItems).toEqual([{ id: 1 }, { id: 2 }]);
      expect(result.current.prevMeta).toEqual({ total: 6 });
      expect(result.current.items).toEqual([]);
      expect(result.current.meta).toEqual({});
      expect(result.current.status).toEqual('pending');

      await waitForNextUpdate();

      expect(result.current.items).toEqual([{ id: 3 }, { id: 4 }]);
      expect(result.current.meta).toEqual({ total: 6 });
      expect(result.current.status).toEqual('succeeded');
    });

    it ('returns the error when the request fails', async () => {
      const failingEntity = {
        key: 'tests',
        provider: {
          fetch: jest.fn(() => Promise.reject({ ok: false, message: 'Bad' })),
        },
        entitiesPath: 'data',
      };
      const { result, waitForNextUpdate } = renderHook(() =>
        useList(failingEntity, { page: 1 })
      );

      await waitForNextUpdate();

      expect(result.current.items).toEqual([]);
      expect(result.current.meta).toEqual({});
      expect(result.current.status).toEqual('failed');
      expect(result.current.error).toEqual({ ok: false, message: 'Bad' });
    });

    it('does not load again the page when it exists and is valid', async () => {
      const staleEntity = {
        ...entity,
        staleTimeout: 100,
      };
      const { result, waitForNextUpdate } = renderHook(() =>
        useList(staleEntity, { page: 1 })
      );

      await waitForNextUpdate();

      expect(result.current.items).toEqual([{ id: 1 }, { id: 2 }]);
      expect(result.current.meta).toEqual({ total: 6 });
      expect(result.current.status).toEqual('succeeded');

      act(() => result.current.setFilters({ page: 1 }));

      expect(result.current.prevItems).toEqual([{ id: 1 }, { id: 2 }]);
      expect(result.current.prevMeta).toEqual({ total: 6 });
      expect(result.current.items).toEqual([{ id: 1 }, { id: 2 }]);
      expect(result.current.meta).toEqual({ total: 6 });
      expect(result.current.status).toEqual('succeeded');
    });

    it('loads again the page when a new item is added', async () => {
      const { result, waitForNextUpdate } = renderHook(() =>
        useList(entity, { page: 1 })
      );

      await waitForNextUpdate();

      expect(result.current.items).toEqual([{ id: 1 }, { id: 2 }]);
      expect(result.current.meta).toEqual({ total: 6 });
      expect(result.current.status).toEqual('succeeded');

      await act(() => result.current.upsert({ id: 9 }));

      expect(result.current.items).toEqual([{ id: 1 }, { id: 2 }]);
      expect(result.current.meta).toEqual({ total: 7 });
      expect(result.current.status).toEqual('succeeded');
    });

    it('loads again the page when an item is removed', async () => {
      const { result, waitForNextUpdate } = renderHook(() =>
        useList(entity, { page: 1 })
      );

      await waitForNextUpdate();

      expect(result.current.items).toEqual([{ id: 1 }, { id: 2 }]);
      expect(result.current.meta).toEqual({ total: 6 });
      expect(result.current.status).toEqual('succeeded');

      await act(() => result.current.remove({ index: 1 }));

      expect(result.current.items).toEqual([{ id: 1 }, { id: 3 }]);
      expect(result.current.meta).toEqual({ total: 5 });
      expect(result.current.status).toEqual('succeeded');
    });

    it('does nothing when the upsert request fails', async () => {
      const failingEntity = {
        ...entity,
        provider: {
          ...entity.provider,
          upsert: () => Promise.reject({ problems: true }),
        },
      };
      const { result, waitForNextUpdate } = renderHook(() =>
        useList(failingEntity, { page: 1 })
      );

      await waitForNextUpdate();

      expect(result.current.items).toEqual([{ id: 1 }, { id: 2 }]);
      expect(result.current.meta).toEqual({ total: 6 });
      expect(result.current.status).toEqual('succeeded');

      try {
        await act(() => result.current.upsert({ index: 1 }));
      } catch (e) {
        expect(e).toEqual({ problems: true });
      }

      expect(result.current.items).toEqual([{ id: 1 }, { id: 2 }]);
      expect(result.current.meta).toEqual({ total: 6 });
      expect(result.current.status).toEqual('succeeded');
    });

    it('does nothing when the remove request fails', async () => {
      const failingEntity = {
        ...entity,
        provider: {
          ...entity.provider,
          remove: () => Promise.reject({ problems: true }),
        },
      };
      const { result, waitForNextUpdate } = renderHook(() =>
        useList(failingEntity, { page: 1 })
      );

      await waitForNextUpdate();

      expect(result.current.items).toEqual([{ id: 1 }, { id: 2 }]);
      expect(result.current.meta).toEqual({ total: 6 });
      expect(result.current.status).toEqual('succeeded');

      try {
        await act(() => result.current.remove({ index: 1 }));
      } catch (e) {
        expect(e).toEqual({ problems: true });
      }

      expect(result.current.items).toEqual([{ id: 1 }, { id: 2 }]);
      expect(result.current.meta).toEqual({ total: 6 });
      expect(result.current.status).toEqual('succeeded');
    });
  });
});
