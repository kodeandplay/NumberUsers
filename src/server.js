import express from 'express';
import socketio from 'socket.io';
import axios from 'axios';
import gis from 'g-image-search';
import path from 'path';

const app = express();

app.set('port', process.env.PORT || 3005);

const server = app.listen(app.get('port'), () => {
  console.log('Server listening on port', app.get('port'));
});

const io = socketio(server);
const UPDATE = 'updateCount';
const id2Code = {};
const counts = {};

const cleanIP = (ip) => {
  let idx = ip.lastIndexOf(':');
  ip = ip.substr(idx+1);
  console.log('ip:', ip);
  return ip;
}

// socket id, client ip
const updateCount = (id, ip) => {
  ip = cleanIP(ip);
  getCountry(id, ip);
}

const getFlag = (code, name) => {
  let query = code + '+' + name + '+flag';
  console.log('query:', query);
  gis(query).then(results => {
      console.log(results[0]);
      counts[code].flag = results[0];
      console.log('counts:', counts);
      io.emit(UPDATE, counts);
    })
    .catch(error => {
      console.log('error:', error);
    });
}

const getCountry = (id, ip) => {
  axios.get(`http://ipinfo.io/${ip}/json`)
    .then(response => {
      let countryCode = response.data.country;
      console.log('countryCode:', countryCode);
      axios.get(`https://restcountries.eu/rest/v1/alpha/${countryCode}`)
	.then(response => {
	  console.log('country code data:', response.data);
	  let code = response.data.alpha3Code
	  let name = response.data.name.replace(/ /g, '+');
	  id2Code[id] = code;
	  console.log('code:', code);
	  console.log('name:', name);
	  console.log(counts);
	  if(code in counts) {
	    counts[code]['count']++;
	    io.emit(UPDATE, counts);
	  } else {
	    counts[code] = { count: 1 }
	    getFlag(code, name);
	  } 
	});
    })
    .catch(error => {
      console.log('error:', error);
    });
}

app.get('/', (req, res) => {
  // updateCount(req.ip);
  res.sendFile(path.join(__dirname,'public','index.html'));
});

io.on('connection', (socket) => {
  console.log('new connection', socket.handshake.address);
  updateCount(socket.id, socket.handshake.address);
  socket.on('disconnect', () => {
    counts[id2Code[socket.id]].count -= 1;
    io.emit(UPDATE, counts);
    console.log('connection closed', socket.id);
  });  

});
