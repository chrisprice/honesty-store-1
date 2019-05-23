import { AbstractItem, Configuration } from './index';

export const truncate = ({ client, tableDescription }: Configuration) =>
  async (item: AbstractItem): Promise<void> => {
    const { TableName: tableName } = await tableDescription;

    if (tableName == null) {
      throw new Error();
    }

    try {
      await client.delete({
        TableName: tableName,
        Key: {
          id: item.id
        },
        ConditionExpression: 'version = :version',
        ExpressionAttributeValues: {
          ':version': item.version
        }
      })
        .promise();
    } catch (e) {
      if (e.code !== 'ConditionalCheckFailedException') {
        throw e;
      }
      throw new Error(`Item is out of date`);
    }
  };
