import { DynamoDB } from 'aws-sdk';
import { __findAll } from './__findAll';
import { create } from './create';
import { find } from './find';
import { findAll } from './findAll';
import { read } from './read';
import { reduce } from './reduce';
import { truncate } from './truncate';
import { update } from './update';

if ((<any>Symbol).asyncIterator == null) {
  (<any>Symbol).asyncIterator = Symbol.for('asyncIterator');
}

// hack - endpoint isn't a valid property according to the typings
interface DocumentClientOptions extends DynamoDB.DocumentClient.DocumentClientOptions {
  endpoint: string;
}

export type Timestamp = number;

export interface HasId {
  /**
   * ID managed by consumer
   */
  id: string;
}

export interface HasVersion {
  /**
   * Monotomically increasing counter managed by store
   */
  version: number;
}

export interface HasMetadata {
  /**
   * Unix timestamp of record creation managed by store.
   * N.B. The store will always silently override this value if specified to support use cases which read an item, modify it and attempt to
   * write it back.
   */
  created: Timestamp;
  /**
   * Unix timestamp of last record modification managed by store.
   * N.B. The store will always silently override this value if specified to support use cases which read an item, modify it and attempt to
   * write it back.
   */
  modified: Timestamp;
  /**
   * Last event to be reduced on to this aggregate or null for non-aggregate records.
   */
  lastReceived?: EventItem;
  /**
   * Last event to be emitted by this aggregate or null for non-aggregate records.
   */
  lastEmitted?: EventItem;
}

export type AbstractItem = HasId & HasVersion;

// hack - should take an Item without IHasVersion & IHasMetadata but need literal type subtraction
// for that https://github.com/Microsoft/TypeScript/issues/12215
export type NewItem<T extends AbstractItem> = T & { version: 0 };

export type EnhancedItem<T extends AbstractItem> = T & HasVersion & HasMetadata;

export type PrototypicalItem<T extends AbstractItem> = Partial<T>;

export type EventItem = HasId & { previous?: string, data: HasId };

export interface Configuration {
  client: DynamoDB.DocumentClient;
  tableDescription: Promise<DynamoDB.TableDescription>;
}

export interface FindConfiguration extends Configuration {
  limit: number;
}

export interface Cruft<
  T extends AbstractItem,
  ReceivedEvent extends HasId = HasId,
  EmittedEvent extends HasId = HasId
  > {
  create(item: NewItem<T>): Promise<EnhancedItem<T>>;
  read(id: string): Promise<EnhancedItem<T>>;
  reduce(
    aggregateIdSelector: (event: ReceivedEvent) => string,
    eventIdSelector: (event: ReceivedEvent) => string,
    reducer: (aggregate: EnhancedItem<T>, event: ReceivedEvent, emit: (event: EmittedEvent) => void) => Promise<EnhancedItem<T>> | EnhancedItem<T>,
    aggregateFactory?: (event: ReceivedEvent) => NewItem<T>
  ): (event: ReceivedEvent, aggregate?: EnhancedItem<T>) => Promise<EnhancedItem<T>>;
  update(item: EnhancedItem<T>): Promise<EnhancedItem<T>>;
  find(fields: PrototypicalItem<T>): Promise<EnhancedItem<T>>;
  __findAll(fields: PrototypicalItem<T>, options?: { limit?: number }): Promise<EnhancedItem<T>[]>;
  findAll(fields: PrototypicalItem<T>): AsyncIterableIterator<EnhancedItem<T>>;
  truncate(item: AbstractItem): Promise<void>;
}

export default <
  Aggregate extends AbstractItem,
  ReceivedEvent extends HasId,
  EmittedEvent extends HasId
  >({
    endpoint = process.env.AWS_DYNAMODB_ENDPOINT,
    region = process.env.AWS_REGION,
    tableName,
    limit
  }): Cruft<Aggregate, ReceivedEvent, EmittedEvent> => {

  const describeTable = async () => {
    const api = new DynamoDB(<{ endpoint: string }>{
      apiVersion: '2012-08-10',
      endpoint,
      region
    });

    const { Table: tableDescription } = await api.describeTable({
      TableName: tableName
    }).promise();
    console.log(tableName);
    if (tableDescription == null) {
      throw new Error(`Table ${tableName} not found`);
    }

    return { TableName: tableName };
  };

  const client = new DynamoDB.DocumentClient(<DocumentClientOptions>{
    apiVersion: '2012-08-10',
    endpoint,
    region
  });

  const tableDescription = describeTable();

  return {
    create: create<Aggregate>({ client, tableDescription }),
    read: read<Aggregate>({ client, tableDescription }),
    reduce: reduce<Aggregate, ReceivedEvent, EmittedEvent>({ client, tableDescription }),
    update: update<Aggregate>({ client, tableDescription }),
    __findAll: __findAll<Aggregate>({ client, tableDescription, limit }),
    findAll: findAll<Aggregate>({ client, tableDescription, limit }),
    find: find<Aggregate>({ client, tableDescription, limit }),
    truncate: truncate({ client, tableDescription })
  };
};
