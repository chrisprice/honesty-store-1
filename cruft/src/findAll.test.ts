import { expect } from 'chai';
import { createTable, cruftForTable, deleteTable, nextId } from './__tests__/aws';

const suiteName = 'findAll';

describe(suiteName, () => {

  beforeAll(createTable(suiteName));
  afterAll(deleteTable(suiteName));
  const cruft = cruftForTable(suiteName);

  it('should find items without filter', async () => {
    const id = nextId();
    await cruft.create({ id, version: 0 });
    for await (const _ of cruft.findAll({ })) {
      return;
    }
    fail('Should find at least one item');
  });

  it('should find items without filter', async () => {
    const id = nextId();
    await cruft.create({ id, version: 0, bar: id });
    for await (const item of cruft.findAll({ bar: id })) {
      expect(item.id).to.equal(id);
    }
  });

  it('should find items over many pages', async () => {
    const id = nextId();
    for (let i = 0; i < 10; i++) {
      await cruft.create({ id: `${id}_${i}`, version: 0, bar: id });
    }
    let i = 0;
    for await (const _item of cruft.findAll({ bar: id })) {
      i++;
    }
    expect(i).to.equal(10, 'Incorrect item count');
  });

  it('should find items over many pages and stop if break called', async () => {
    const id = nextId();
    for (let i = 0; i < 15; i++) {
      await cruft.create({ id: `${id}_${i}`, version: 0, bar: id });
    }
    let i = 0;
    for await (const _item of cruft.findAll({ bar: id })) {
      if (++i === 10) {
        break;
      }
    }
    expect(i).to.equal(10, 'Incorrect item count');
  });

});
