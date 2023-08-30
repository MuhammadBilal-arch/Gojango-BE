const cors = require('cors');
const dotenv = require('dotenv');
const express = require('express');
const app = express();
const path = require('path');
const indexRouter = require('./router');
const http = require('http');
const socketIo = require('socket.io');
const server = http.createServer(app);

dotenv.config({ path: './.env' });

const PORT = process.env.PORT || 3000;

require('./db/connection');

const corsOptions = {
    origin: '*',
    credentials: true,
    optionSuccessStatus: 200,
};

app.use(cors(corsOptions));

const io = socketIo(server, {
    cors: {
        origin: corsOptions.origin,
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

app.locals.io = io;

require('./model/user');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

app.use('/test', (req, res) => {
    res.send('API is working');
});

io.on('connection', (socket) => {
    console.log(`Socket ${socket.id} connected`);
});

server.listen(PORT, () => {
    console.log(
        `server version ${process.env.VERSION} is running at port ${PORT}`
    );
});
