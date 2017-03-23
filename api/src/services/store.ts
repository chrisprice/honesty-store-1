import { Box, getBoxesForStore } from '../../../box/src/client';
import { getItem } from './item';

export interface StoreItem {
  name: string;
  image: string;

  count: number;

  id: string;
  price: {
    total: number;
    breakdown: PriceBreakdown;
  };
}

interface PriceBreakdown {
  creditCardFee: number;
  VAT: number;

  shippingCost: number;
  warehousingCost: number;
  packagingCost: number;
  packingCost: number;
  serviceFee: number;
}

const stores = ['sl-ncl', 'sl-edn', 'sl-brs', 'sl-ldn', 'dev-test', 'dev-test-2'];

// currently storeCode and storeID are identical
export const storeIDToStoreCode = (storeID) => storeID;
export const storeCodeToStoreID = (storeCode) => storeCode;

const assertValidStoreCode = (storeCode) => {
  if (!stores.some(el => el === storeCode)) {
    throw new Error(`Store does not exist with code '${storeCode}'`);
  }
};

const getOldestBoxContainingItem = (boxes: Box[], itemID: string) => {
  const boxesWithItem = boxesContainingItem(boxes, itemID);

  if (boxesWithItem.length === 0) {
    throw new Error(`No boxes found containing item ${itemID}`);
  }

  let oldestBox: Box;

  for (const box of boxesWithItem) {
    console.log(box);
    if (oldestBox == null || box.received < oldestBox.received) {
      oldestBox = box;
    }
  }

  return oldestBox;
}

const getItemPriceFromBoxes = (boxes: Box[], itemID: string) => {
  const oldestBox = getOldestBoxContainingItem(boxes, itemID);
  const { total } = extractBoxItem(oldestBox, itemID);
  return total;
}

export const getItemPriceFromStore = async (key, storeCode: string, itemIDToFind: string) => {
  assertValidStoreCode(storeCode);
  const boxes = await getBoxesForStore(key, storeCode);
  return getItemPriceFromBoxes(boxes, itemIDToFind);
};

const getUniqueItemCounts = (boxes: Box[]) => {
  const map = new Map<string, number>();
  for (const box of boxes) {
    for (const { itemID, count, depleted } of box.boxItems) {
      const existingCount = map.has(itemID) ? map.get(itemID) : 0;
      map.set(itemID, existingCount + (depleted ? 0 : count));
    }
  }
  return Array.from(map.entries())
    .map(([itemID, count]) => ({ itemID, count }));
};

const boxesContainingItem = (boxes: Box[], itemId) =>
  boxes.filter(({ boxItems }) => boxItems.some( ({ itemID }) => itemId === itemID));

const extractBoxItem = (box: Box, itemID: string) => box.boxItems.find((el) => el.itemID === itemID);

const priceBreakdown = (boxes: Box[], itemID): PriceBreakdown => {
  const oldestBox = getOldestBoxContainingItem(boxes, itemID);
  const { creditCardFee, VAT, shippingCost, warehousingCost, packagingCost, packingCost, serviceFee } = extractBoxItem(oldestBox, itemID);

  return {
    creditCardFee,
    VAT,
    shippingCost,
    warehousingCost,
    packagingCost,
    packingCost,
    serviceFee
  };
};

export const storeItems = async (key, storeCode): Promise<StoreItem[]> => {
  const openBoxes = (await getBoxesForStore(key, storeCode))
    .filter(({ closed }) => closed == null)

  return Promise.all(
    getUniqueItemCounts(openBoxes)
      .map(async ({ itemID, count }) => ({
        ...getItem(itemID),
        count,
        id: itemID,
        price: {
          total: getItemPriceFromBoxes(openBoxes, itemID),
          breakdown: priceBreakdown(openBoxes, itemID)
        }
      }))
  );
};
