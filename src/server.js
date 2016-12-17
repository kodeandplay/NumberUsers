import express from 'express';
import socketio from 'socket.io';

const app = express();

app.set('port', process.env.PORT || 3005);

const server = app.listen(app.get('port'), () => {
  console.log('Server listening on port', app.get('port'));
});

const io = socketio(server);

const address = {};

app.get('/', (req, res) => {
  let ip = req.ip;
  let idx = ip.lastIndexOf(':');
  ip = ip.substr(idx+1);
  address[ip] = (address[ip] || 0) + 1;
  res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', (socket) => {
  console.log('new connection');
  console.log(address);
  socket.on('disconnect', () => {
    console.log('connection closed');
  });  

});
