import { create } from './create';
import { AbstractItem, Configuration, EnhancedItem, EventItem, NewItem, HasId } from './index';
import { read } from './read';
import { update } from './update';

type ReduceEmit<Event> = (event: Event) => void;
type MaybePromise<T> = Promise<T> | T;

export const reduce = <
  Aggregate extends AbstractItem,
  ReceivedEvent extends HasId,
  EmittedEvent extends HasId
  >({ client, tableDescription }: Configuration) => {

  const getAggregate = async (
    aggregateIdSelector: (event: ReceivedEvent) => string,
    suppliedAggregate: EnhancedItem<Aggregate> | undefined,
    event: ReceivedEvent,
    aggregateFactory?: (event: ReceivedEvent) => NewItem<Aggregate>
  ): Promise<EnhancedItem<Aggregate>> => {
    const id = aggregateIdSelector(event);

    if (suppliedAggregate != null) {
      if (suppliedAggregate.id !== id) {
        throw new Error(`Aggregate supplied ${suppliedAggregate.id} does not match id ${id}`);
      }
      return suppliedAggregate;
    }

    try {
      return await read<Aggregate>({ client, tableDescription, consistent: false })(id);
    } catch (e) {
      if (aggregateFactory == null || e.message !== `Key not found ${id}`) {
        throw e;
      }
    }

    const newAggregate = aggregateFactory(event);
    if (newAggregate.id !== id) {
      throw new Error(`New aggregate id ${newAggregate.id} does not match selected id ${id}`);
    }
    return await create<Aggregate>({ client, tableDescription })(newAggregate);
  };

  return (
    aggregateIdSelector: (event: ReceivedEvent) => string,
    eventIdSelector: (event: ReceivedEvent) => string,
    reducer: (
      aggregate: EnhancedItem<Aggregate>,
      event: ReceivedEvent,
      emit: ReduceEmit<EmittedEvent>
    ) => MaybePromise<EnhancedItem<Aggregate>>,
    aggregateFactory?: (event: ReceivedEvent) => NewItem<Aggregate>
  ) =>
    async (event: ReceivedEvent, aggregate?: EnhancedItem<Aggregate>): Promise<EnhancedItem<Aggregate>> => {

      const { TableName: tableName } = await tableDescription;

      if (tableName == null) {
        throw new Error();
      }

      const innerAggregate = await getAggregate(
        aggregateIdSelector,
        aggregate,
        event,
        aggregateFactory
      );

      const eventId = eventIdSelector(event);

      const {
        lastReceived: previousLastReceived,
        lastEmitted: previousLastEmitted
      } = innerAggregate;

      if (previousLastReceived != null && previousLastReceived.id === eventId) {
        return innerAggregate;
      }

      let archivedEvent: EventItem | null = null;

      try {
        archivedEvent = await read<EventItem & { version: 0 }>({ client, tableDescription, consistent: true })(eventId);
      } catch (e) {
        if (e.message !== `Key not found ${eventId}`) {
          throw e;
        }
      }

      if (archivedEvent != null) {
        return innerAggregate;
      }

      if (previousLastReceived != null) {
        try {
          await create<EventItem & { version: 0 }>({ client, tableDescription })(<EventItem & { version: 0 }>previousLastReceived);
        } catch (e) {
          if (e.message !== `Item already exists ${previousLastReceived.id}`) {
            throw e;
          }
        }
      }

      if (previousLastEmitted != null) {
        try {
          await create<EventItem & { version: 0 }>({ client, tableDescription })(<EventItem & { version: 0 }>previousLastEmitted);
        } catch (e) {
          if (e.message !== `Item already exists ${previousLastEmitted.id}`) {
            throw e;
          }
        }
      }

      let updatedLastEmitted: EventItem | null = null;

      const emit = (emittedEvent: EmittedEvent) => {
        if (updatedLastEmitted != null) {
          throw new Error(`Currently emit can only be invoked once ${updatedLastEmitted.id}.`);
        }

        updatedLastEmitted = {
          id: emittedEvent.id,
          data: emittedEvent,
          previous: innerAggregate.lastEmitted && innerAggregate.lastEmitted.id
        };
      };

      const reducedAggregate = await reducer(innerAggregate, event, emit);

      const updatedLastReceived: EventItem = {
        id: eventId,
        data: event,
        previous: previousLastReceived && previousLastReceived.id
      };

      const updatedAggregate = Object.assign(
        {},
        reducedAggregate,
        {
          lastReceived: updatedLastReceived,
          lastEmitted: updatedLastEmitted
        }
      );

      return await update<Aggregate>({ client, tableDescription })(updatedAggregate);
    };
};
