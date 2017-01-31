import express = require('express');
import bodyParser = require('body-parser');
import logoutController from './controllers/logout';
import purchaseController from './controllers/purchase';
import registerController from './controllers/register';
import sessionController from './controllers/session';
import signInController from './controllers/signin';
import storeController from './controllers/store';
import supportController from './controllers/support';
import topUpController from './controllers/topup';
import transactionsController from './controllers/transactions';
import expressLogging = require('express-logging');
import logger = require('logops');

const app = express();
const router = express.Router();

app.use(expressLogging(logger));

app.use(bodyParser.json());

registerController(router);
sessionController(router);
signInController(router);
topUpController(router);
purchaseController(router);
storeController(router);
logoutController(router);
transactionsController(router);
supportController(router);

app.use('/api/v1', router);

// send healthy response to load balancer probes
app.get('/', (res) => {
  res.send(200);
});

app.listen(3000);
