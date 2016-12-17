import express from 'express';
import socketio from 'socket.io';

const app = express();

app.set('port', process.env.PORT || 3005);

const server = app.listen(app.get('port'), () => {
  console.log('Server listening on port', app.get('port'));
});

const io = socketio(server);

const counts = {};

app.get('/', (req, res) => {
  console.log('x-forwarded-for': req.headers['x-forwarded-for']);
  console.log('remoteAddress:', req.connection.remoteAddress);
  console.log('ip:', req.ip);
  res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', (socket) => {
  console.log('new connection');

  socket.on('disconnect', () => {
    console.log('connection closed');
  });  

});
