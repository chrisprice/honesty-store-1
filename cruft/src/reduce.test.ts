import { createTable, cruftForTable, deleteTable, nextId } from './__tests__/aws';

const suiteName = 'reduce';

describe(suiteName, () => {

  beforeAll(createTable(suiteName));
  afterAll(deleteTable(suiteName));
  const cruft = cruftForTable(suiteName);

  it('should throw if aggregate is not found', async () => {
    const id = nextId();
    try {
      await cruft.reduce(_ => id, _ => '', (aggregate, _) => aggregate)({ id: nextId() });
      fail('Aggregate not found');
    } catch (e) {
      if (e.message !== `Key not found ${id}`) {
        throw e;
      }
    }
  });

  it('should reduce the first event on to an empty aggregate', async () => {
    const aggregateId = nextId();
    const event = {
      id: nextId()
    };
    await cruft.create({ id: aggregateId, version: 0 });
    const reduce = cruft.reduce(_ => aggregateId, ({ id }) => id, (aggregate, _) => aggregate);
    const aggregate = await reduce(event);
    expect(aggregate.lastReceived && aggregate.lastReceived.id).toEqual(event.id);
    expect(aggregate.lastReceived && aggregate.lastReceived.data).toEqual(event);
    expect(aggregate.lastReceived && aggregate.lastReceived.previous).toEqual(undefined);
  });

  it('should archive event when limit reached', async () => {
    const aggregateId = nextId();
    const event = {
      id: nextId()
    };
    await cruft.create({ id: aggregateId, version: 0 });
    const reduce = cruft.reduce(_ => aggregateId, ({ id }) => id, (aggregate, _) => aggregate);
    let aggregate = await reduce(event);
    aggregate = await reduce({
      id: nextId()
    });
    expect(aggregate.lastReceived && aggregate.lastReceived.id).not.toEqual(event.id);
    expect(aggregate.lastReceived && aggregate.lastReceived.previous).toEqual(event.id);
  });

  it('should ignore the last event', async () => {
    const aggregateId = nextId();
    const event = {
      id: nextId()
    };
    await cruft.create({ id: aggregateId, version: 0 });
    const reduce = cruft.reduce(_ => aggregateId, ({ id }) => id, (aggregate, _) => aggregate);
    let aggregate = await reduce(event);
    expect(aggregate.version).toEqual(1);
    aggregate = await reduce(event);
    expect(aggregate.version).toEqual(1);
  });

  it('should ignore archived events', async () => {
    const aggregateId = nextId();
    const event = {
      id: nextId()
    };
    await cruft.create({ id: aggregateId, version: 0 });
    await cruft.create({ id: event.id, version: 0, data: event });
    const reduce = cruft.reduce(_ => aggregateId, ({ id }) => id, (aggregate, _) => aggregate);
    const aggregate = await reduce(event);
    expect(aggregate.version).toEqual(0);
  });

  it('should permit one emitted event', async () => {
    const aggregateId = nextId();
    const event = {
      id: nextId()
    };
    await cruft.create({ id: aggregateId, version: 0 });
    const reduce = cruft.reduce(_ => aggregateId, ({ id }) => id, (aggregate, _, emit) => {
      emit({ id: 'a' });
      return aggregate;
    });

    const aggregate = await reduce(event);

    expect(aggregate.lastEmitted).toEqual({
      id: 'a',
      previous: undefined,
      data: {
        id: 'a', version: 0
      }
    });
  });

  it('should not permit more than one emitted event', async () => {
    const aggregateId = nextId();
    const event = {
      id: nextId()
    };
    await cruft.create({ id: aggregateId, version: 0 });
    const reduce = cruft.reduce(_ => aggregateId, ({ id }) => id, (aggregate, _, emit) => {
      emit({ id: 'a' });
      emit({ id: 'b' });
      return aggregate;
    });

    try {
      await reduce(event);
      fail('should have thrown');
    } catch (e) {
      if (e.message !== 'Currently emit can only be invoked once a.') {
        throw e;
      }
    }
  });

  it('should allow aggregate to be supplied', async () => {
    const aggregateId = nextId();
    const event = {
      id: nextId()
    };
    const aggregate = await cruft.create({ id: aggregateId, version: 0 });
    const reduce = cruft.reduce(_ => aggregateId, ({ id }) => id, (agg) => agg);

    const result = await reduce(event, aggregate);

    expect(result.lastReceived && result.lastReceived.id).toEqual(event.id);
  });

  it('should not allow aggregate with mismatched id to be supplied', async () => {
    const aggregateId = nextId();
    const event = {
      id: nextId()
    };
    const aggregate = await cruft.create({ id: aggregateId, version: 0 });
    const reduce = cruft.reduce(_ => 'foo', ({ id }) => id, (agg) => agg);

    try {
      await reduce(event, aggregate);
      fail('should have thrown');
    } catch (e) {
      if (e.message !== `Aggregate supplied ${aggregate.id} does not match id foo`) {
        throw e;
      }
    }
  });

  it('should call the aggregate factory if supplied and record not found', async () => {
    const aggregateId = nextId();
    const event = {
      id: nextId()
    };
    const reduce = cruft.reduce(_ => aggregateId, ({ id }) => id, (agg) => agg, () => ({ id: aggregateId, version: 0 }));
    const aggregate = await reduce(event);
    expect(aggregate.id).toEqual(aggregateId);
    expect(aggregate.lastReceived && aggregate.lastReceived.id).toEqual(event.id);
  });

  it('should not call the aggregate factory if aggregate found', async () => {
    const aggregateId = nextId();
    const event = {
      id: nextId()
    };
    await cruft.create({ id: aggregateId, version: 0 });
    const reduce = cruft.reduce(_ => aggregateId, ({ id }) => id, (agg) => agg, () => {
      throw new Error('Should not call factory');
    });
    const aggregate = await reduce(event);
    expect(aggregate.id).toEqual(aggregateId);
    expect(aggregate.lastReceived && aggregate.lastReceived.id).toEqual(event.id);
  });

  it('should error if aggregate factory returns mismatched id', async () => {
    const aggregateId = nextId();
    const event = {
      id: nextId()
    };
    const aggregate: { id: string, version: 0 } = {
      id: nextId(),
      version: 0
    };
    const reduce = cruft.reduce(_ => aggregateId, ({ id }) => id, (agg) => agg, () => aggregate);

    try {
      await reduce(event);
      fail('should have thrown');
    } catch (e) {
      if (e.message !== `New aggregate id ${aggregate.id} does not match selected id ${aggregateId}`) {
        throw e;
      }
    }
  });

});
