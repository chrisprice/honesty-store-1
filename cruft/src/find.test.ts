import { expect } from 'chai';
import { createTable, cruftForTable, deleteTable, nextId } from './__tests__/aws';

const suiteName = 'find';

describe(suiteName, () => {

  beforeAll(createTable(suiteName));
  afterAll(deleteTable(suiteName));
  const cruft = cruftForTable(suiteName);

  it('should find an item', async () => {
    const id = nextId();
    await cruft.create({ id, version: 0, find: 4 });
    const item = await cruft.find({ find: 4 });
    expect(item.id).to.equal(id, 'Incorrect item');
  });

  it('should throw when finding an item by id', async () => {
    const id = nextId();
    await cruft.create({ id, version: 0 });
    try {
      await cruft.find({ id });
      fail('Find by id should not be supported');
    } catch (e) {
      if (e.message !== 'Use read rather than find if you know the id') {
        throw e;
      }
    }
  });

  it('should throw when finding multiple item', async () => {
    const id = nextId();
    await cruft.create({ id: nextId(), version: 0, bar: id });
    await cruft.create({ id: nextId(), version: 0, bar: id });
    try {
      await cruft.find({ bar: id });
      fail('Should throw if multiple results found');
    } catch (e) {
      if (e.message !== 'Multiple values found') {
        throw e;
      }
    }
  });

  it('should throw if item is missing', async () => {
    const id = nextId();
    try {
      await cruft.find({ bar: id });
      fail('Should throw if no results found');
    } catch (e) {
      if (e.message !== 'No value found') {
        throw e;
      }
    }
  });

  it('should throw when finding an item with an invalid attribute name', async () => {
    try {
      await cruft.find({ 'uh oh': true });
      fail('Should throw error');
    } catch (e) {
      if (e.message !== 'Invalid field name specified uh oh') {
        throw e;
      }
    }
  });

});
