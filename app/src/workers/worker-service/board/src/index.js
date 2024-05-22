const express = require('express');
const { Queue } = require('bullmq');
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');
// const path = require('path');
// require('dotenv').config({ path: path.resolve(__dirname, '../../../../.env') });

const queueMQ = new Queue('audio transcoding', {
  connection: {
    host: process.env.REDIS_HOST || "redis",
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
  },
}); // Specify Redis connection using object);

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

const {
  // eslint-disable-next-line no-unused-vars
  addQueue, removeQueue, setQueues, replaceQueues,
} = createBullBoard({
  queues: [new BullMQAdapter(queueMQ)],
  serverAdapter,
});

const app = express();

app.use('/admin/queues', serverAdapter.getRouter());

// other configurations of your server

app.listen(6379, () => {
  console.log('Running Bull Board on 6379...');
  console.log('For the UI, open http://localhost:6379/admin/queues');
  console.log('Make sure Redis is running on port 6379 by default');
});
