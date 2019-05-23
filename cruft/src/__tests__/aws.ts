import { DynamoDB } from 'aws-sdk';
import { v4 as uuid } from 'uuid';
import index, { Cruft, HasId } from '../index';

export interface Foo {
  id: string;
  version: number;
  [key: string]: any;
}

const tablePrefix = 'cruft-ddb-';
const region = 'eu-west-1';
const endpoint = 'http://localhost:8000/';

const db = new DynamoDB(<{ apiVersion: string, endpoint: string }>{
  apiVersion: '2012-08-10',
  endpoint,
  region
});

export const cruftForTable = (tableName): Cruft<Foo> =>
  index<Foo, HasId, HasId>({
    endpoint,
    region,
    tableName: tablePrefix + tableName,
    limit: 5
  });

export const createTable = (tableName: string) =>
  async () => {
    try {
      await db.createTable({
        AttributeDefinitions: [
          {
            AttributeName: 'id',
            AttributeType: 'S'
          }
        ],
        KeySchema: [
          {
            AttributeName: 'id',
            KeyType: 'HASH'
          }
        ],
        TableName: tablePrefix + tableName,
        ProvisionedThroughput: {
          ReadCapacityUnits: 1,
          WriteCapacityUnits: 1
        }
      })
        .promise();
    } catch (e) {
      // tslint:disable-next-line:no-console
      console.log(e);
      // ignore
    }
  };

export const deleteTable = (tableName: string) =>
  async () => {
    try {
      await db.deleteTable({ TableName: tablePrefix + tableName })
        .promise();
    } catch (e) {
      // tslint:disable-next-line:no-console
      console.log(e);
      // ignore
    }
  };

export const nextId = () => uuid();
