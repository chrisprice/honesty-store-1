import { createTable, cruftForTable, deleteTable, nextId } from './__tests__/aws';

const suiteName = 'truncate';

describe(suiteName, () => {

  beforeAll(createTable(suiteName));
  afterAll(deleteTable(suiteName));
  const cruft = cruftForTable(suiteName);

  it('should truncate an item', async () => {
    const id = nextId();
    await cruft.create({ id, version: 0 });
    await cruft.truncate({ id, version: 0 });
  });

  it('should throw when truncating an out of date item', async () => {
    const id = nextId();
    const original = await cruft.create({ id, version: 0, bar: 0 });
    await cruft.update(Object.assign({}, original, { bar: 1 }));
    try {
      await cruft.truncate({ id, version: original.version });
      fail('Item is out of date');
    } catch (e) {
      if (e.message !== 'Item is out of date') {
        throw e;
      }
    }
  });

});
