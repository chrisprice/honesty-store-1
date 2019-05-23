import { AbstractItem, Configuration, EnhancedItem } from './index';

export const read = <T extends AbstractItem>({ client, tableDescription, consistent = false }: Configuration & { consistent?: boolean }) =>
  async (id: string): Promise<EnhancedItem<T>> => {
    const { TableName: tableName } = await tableDescription;

    if (tableName == null) {
      throw new Error();
    }

    const response = await client.get({
      TableName: tableName,
      Key: {
        id
      },
      ConsistentRead: consistent
    })
      .promise();

    if (response.Item == null) {
      throw new Error(`Key not found ${id}`);
    }

    return <EnhancedItem<T>>response.Item;
  };
