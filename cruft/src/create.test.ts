import { expect } from 'chai';
import { createTable, cruftForTable, deleteTable, nextId } from './__tests__/aws';

const suiteName = 'create';

describe(suiteName, () => {

  beforeAll(createTable(suiteName));
  afterAll(deleteTable(suiteName));
  const cruft = cruftForTable(suiteName);

  it('should create a new item', async () => {
    const id = nextId();
    const item = await cruft.create({ id, version: 0 });
    expect(item.id).to.equal(id, 'Incorrect item id');
    expect(item.version).to.equal(0, 'Incorrect item version');
    expect(item.created).to.equal(item.modified, 'Incorrect timestamps');
  });

  it('should throw when creating an existing item', async () => {
    const id = nextId();
    await cruft.create({ id, version: 0 });
    try {
      await cruft.create({ id, version: 0 });
      fail('Item already exists');
    } catch (e) {
      if (e.message !== `Item already exists ${id}`) {
        throw e;
      }
    }
  });

  it('should throw when creating an item with an invalid attribute name', async () => {
    const id = nextId();
    try {
      await cruft.create({ id, version: 0, 'uh oh': true });
      fail('Item has an invalid attribute name');
    } catch (e) {
      if (e.message !== 'Invalid field name specified uh oh') {
        throw e;
      }
    }
  });

});
