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
const key_1 = require("@honesty-store/service/lib/key");
const topup_1 = require("@honesty-store/topup");
const stream_1 = require("@honesty-store/transaction/lib/client/stream");
const asyncHandler = (event) => __awaiter(this, void 0, void 0, function* () {
    const key = key_1.createServiceKey({ service: 'transaction-topup' });
    for (const transaction of stream_1.subscribeTransactionsAndBalances(event)) {
        yield topup_1.recordTransaction(key, transaction);
    }
    return `Successfully processed ${event.Records.length} records`;
});
exports.handler = (event, context) => asyncHandler(event)
    .then(info => context.succeed(info))
    .catch(e => context.fail(e));
