import { findAll } from './findAll';
import { AbstractItem, EnhancedItem, FindConfiguration, PrototypicalItem } from './index';

export const find = <T extends AbstractItem>({ client, tableDescription, limit }: FindConfiguration) =>
  async (fields: PrototypicalItem<T>): Promise<EnhancedItem<T>> => {
    const items = await findAll<T>({ client, tableDescription, limit })(fields);

    const firstResult = await items.next();

    if (firstResult.done) {
      throw new Error('No value found');
    }

    const secondResult = await items.next();

    if (!secondResult.done) {
      throw new Error('Multiple values found');
    }

    return firstResult.value;
  };
