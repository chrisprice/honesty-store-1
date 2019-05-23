import { expect } from 'chai';
import { createTable, cruftForTable, deleteTable, nextId } from './__tests__/aws';

const suiteName = 'update';

describe(suiteName, () => {

  beforeAll(createTable(suiteName));
  afterAll(deleteTable(suiteName));
  const cruft = cruftForTable(suiteName);

  it('should update an item', async () => {
    const id = nextId();
    const original = await cruft.create({ id, version: 0, bar: 0 });
    const updated = await cruft.update(Object.assign({}, original, { bar: 1 }));
    expect(original.id).to.equal(updated.id, 'Incorrect item id');
    expect(updated.version).to.equal(1, 'Incorrect item version');
    expect(original.created).to.equal(updated.created, 'Incorrect created timestamp');
    expect(updated.created).not.to.equal(updated.modified, 'Incorrect updated timestamp');
    expect(updated.bar).to.equal(1, 'Incorrect attribute value');
  });

  it('should update an item with a reserved attribute name', async () => {
    const id = nextId();
    const original = await cruft.create({ id, version: 0, count: 0 });
    const updated = await cruft.update(Object.assign({}, original, { count: 1 }));
    expect(updated.count).to.equal(1, 'Incorrect attribute value');
  });

  it('should throw when updating an out of date item (version)', async () => {
    const id = nextId();
    const original = await cruft.create({ id, version: 0, bar: 0 });
    await cruft.update(Object.assign({}, original, { bar: 1 }));
    try {
      await cruft.update(Object.assign({}, original, { count: 1 }));
      fail('Item is out of date');
    } catch (e) {
      if (e.message !== 'Item is out of date') {
        throw e;
      }
    }
  });

  it('should throw if updating an immutable field (created)', async () => {
    const id = nextId();
    const original = await cruft.create({ id, version: 0 });
    try {
      await cruft.update(Object.assign({}, original, { created: 1 }));
      fail('Immutable field updated');
    } catch (e) {
      if (e.message !== 'Item is out of date') {
        throw e;
      }
    }
  });

  it('should throw when updating an item with an invalid attribute name', async () => {
    const id = nextId();
    const original = await cruft.create({ id, version: 0 });
    try {
      await cruft.update(Object.assign({}, original, { 'uh oh': true }));
      fail('Item has an invalid attribute name');
    } catch (e) {
      if (e.message !== 'Invalid field name specified uh oh') {
        throw e;
      }
    }
  });

});
