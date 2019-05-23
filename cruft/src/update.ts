import { assertHasValidDynamoDBFieldNames } from './assertHasValidDynamoDBFieldNames';
import { AbstractItem, Configuration, EnhancedItem } from './index';

export const update = <T extends AbstractItem>({ client, tableDescription }: Configuration) =>
  async (item: EnhancedItem<T>): Promise<EnhancedItem<T>> => {
    assertHasValidDynamoDBFieldNames(item);

    const { TableName: tableName } = await tableDescription;

    if (tableName == null) {
      throw new Error();
    }

    // hack - can't use object rest/spread with types yet - Microsoft/TypeScript/issues/10727
    const itemWithMetadata = Object.assign({}, item, {
      version: item.version + 1,
      modified: Date.now()
    });

    const conditionAttributeValues = {
      ':previousVersion': item.version,
      ':previousCreated': item.created
    };

    try {
      await client.put({
        TableName: tableName,
        Item: itemWithMetadata,
        ConditionExpression: 'version = :previousVersion AND created = :previousCreated',
        ExpressionAttributeValues: conditionAttributeValues
      })
        .promise();
      return itemWithMetadata;
    } catch (e) {
      if (e.code !== 'ConditionalCheckFailedException') {
        throw e;
      }
      throw new Error(`Item is out of date`);
    }
  };
