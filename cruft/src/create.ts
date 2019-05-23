import { assertHasValidDynamoDBFieldNames } from './assertHasValidDynamoDBFieldNames';
import { AbstractItem, Configuration, EnhancedItem, NewItem } from './index';

export const create = <T extends AbstractItem>({ client, tableDescription }: Configuration) =>
  async (item: NewItem<T>): Promise<EnhancedItem<T>> => {
    assertHasValidDynamoDBFieldNames(item);

    const now = Date.now();

    // hack - can't use object rest/spread with types yet - Microsoft/TypeScript/issues/10727
    const itemWithMetadata = Object.assign({}, item, {
      version: 0,
      created: now,
      modified: now
    });

    const { TableName: tableName } = await tableDescription;
    console.log(await tableDescription);
    if (tableName == null) {
      throw new Error();
    }

    try {
      await client.put({
        TableName: tableName,
        Item: itemWithMetadata,
        ConditionExpression: 'attribute_not_exists(id)'
      })
        .promise();
    } catch (e) {
      if (e.code !== 'ConditionalCheckFailedException') {
        throw e;
      }
      throw new Error(`Item already exists ${item.id}`);
    }

    return itemWithMetadata;
  };
