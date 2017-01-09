const request = require('request');
const assert = require('chai').assert;

const { registerAccount, getAccount, __accounts } = require('../../src/services/accounts');
const { getItems } = require('../../src/services/store');

require('../../src/app');

const baseURL = 'http://localhost:3000/api/v1';

beforeEach(() => {
  __accounts.length = 0;
});

describe('/store', () => {
  const sendRequest = (accessToken, storeCode, callback) => {
    request.post({
      uri: `${baseURL}/store`,
      json: true,
      body: {
        storeCode: `${storeCode}`,
      },
      auth: {
        bearer: accessToken,
      },
    },
    callback);
  };

  it('should return the items associated with given store when store code is valid',
    (done) => {
      const storeCode = 'NCL';
      const { accessToken } = registerAccount(storeCode);
      sendRequest(accessToken,
        storeCode,
        (error, response, body) => {
          const expectedItems = getItems(storeCode);
          assert.deepEqual(body.response, expectedItems);
          done();
        });
    });

  it('should update the user\'s default store',
    (done) => {
      const initialStoreCode = 'NCL';
      const { id, accessToken } = registerAccount(initialStoreCode);

      const newStoreCode = 'EDIN';
      sendRequest(accessToken,
        newStoreCode,
        () => {
          const { defaultStoreCode } = getAccount(id);
          assert.equal(defaultStoreCode, newStoreCode);
          done();
        });
    });
});
