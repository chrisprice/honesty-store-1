"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const csv_1 = require("csv");
const cruft_1 = require("@honesty-store/cruft");
const item_1 = require("@honesty-store/item");
const assert_1 = require("@honesty-store/service/lib/assert");
const key_1 = require("@honesty-store/service/lib/key");
const slack_1 = require("@honesty-store/service/lib/slack");
const store_1 = require("@honesty-store/store");
const stream_1 = require("@honesty-store/transaction/lib/client/stream");
const user_1 = require("@honesty-store/user");
const cruft = cruft_1.default({
    tableName: process.env.TABLE_NAME,
    limit: 100
});
const csvStringify = (objects, options) => new Promise((resolve, reject) => csv_1.stringify(objects, options, (err, data) => {
    if (err) {
        return reject(err);
    }
    return resolve(data);
}));
const getCommonItemTransactionDetails = (key, { id: transactionId, data: { itemId, storeId, userId }, amount }) => __awaiter(this, void 0, void 0, function* () {
    const [user, item, store] = yield Promise.all([
        user_1.getUser(key, userId),
        item_1.getItem(key, itemId),
        store_1.getStoreFromId(key, storeId)
    ]);
    const shortTxId = transactionId.replace(/^(.{5}).*:(.{5}).*/, '$1:$2');
    return {
        emailAddress: user.emailAddress,
        itemDescription: item.name + (item.qualifier ? ` ${item.qualifier}` : ''),
        storeCode: store.code,
        price: Math.abs(amount),
        shortTxId
    };
});
const sendSlackRefundMessage = (key, transaction) => __awaiter(this, void 0, void 0, function* () {
    const commonDetails = yield getCommonItemTransactionDetails(key, transaction);
    const { data: { reason: comment } } = transaction;
    const message = Object.assign({ emoji: ':money_with_wings:', type: 'refund' }, commonDetails, { comment });
    yield sendTransactionNotification(key, message);
});
const sendSlackPurchaseMessage = (key, transaction) => __awaiter(this, void 0, void 0, function* () {
    const commonDetails = yield getCommonItemTransactionDetails(key, transaction);
    const message = Object.assign({ emoji: ':moneybag:', type: 'purchase' }, commonDetails, { comment: '' });
    yield sendTransactionNotification(key, message);
});
const sendTransactionNotification = (key, message) => __awaiter(this, void 0, void 0, function* () {
    const csvMessage = yield csvStringify([message], { header: false });
    yield slack_1.sendSlackMessageOneLine({
        key,
        message: csvMessage,
        channel: 'purchases'
    });
});
const asyncHandler = (dynamoEvent) => __awaiter(this, void 0, void 0, function* () {
    const key = key_1.createServiceKey({ service: 'transaction-slack' });
    const transactions = [...stream_1.subscribeTransactions(dynamoEvent)];
    const sendSlackMessage = (event) => __awaiter(this, void 0, void 0, function* () {
        const transaction = transactions.find(({ id }) => id === event.id);
        switch (event.type) {
            case 'purchase':
                yield sendSlackPurchaseMessage(key, transaction);
                break;
            case 'refund':
                yield sendSlackRefundMessage(key, transaction);
                break;
            default:
                assert_1.assertNever(event.type);
                break;
        }
    });
    const reduce = cruft.reduce(_event => 'aggregate', event => event.id, (aggregate, event, _emit) => __awaiter(this, void 0, void 0, function* () {
        yield sendSlackMessage(event);
        return aggregate;
    }));
    for (const transaction of transactions) {
        if (transaction.type !== 'purchase' && transaction.type !== 'refund') {
            continue;
        }
        const simplifiedTx = {
            id: transaction.id,
            type: transaction.type,
            version: 0
        };
        yield reduce(simplifiedTx);
    }
    return `Successfully processed ${dynamoEvent.Records.length} records`;
});
exports.handler = (event, context) => asyncHandler(event)
    .then(info => context.succeed(info))
    .catch(e => context.fail(e));
