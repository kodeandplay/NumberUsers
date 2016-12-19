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
const TAGET = 'target';
const BORDERLINE = 5;
const ip2Code = {};
const id2Ip = {};
const counts = {};

const cleanIP = (ip) => {
  let idx = ip.lastIndexOf(':');
  ip = ip.substr(idx+1);
  console.log('ip:', ip);
  return ip;
}

// socket id, client ip
const updateCount = (ip) => {
  getCountry(ip);
}

const getFlag = (code, name) => {
  let query = code + '+' + name + '+flag';
  console.log('query:', query);
  gis(query).then(results => {
      counts[code].flag = results[0];
      io.emit(UPDATE, counts);
    })
    .catch(error => {
      console.log('error:', error);
    });
}

const checkTarget = () => {
  let current = Object.keys(counts).reduce((result, key) => {
    return counts[key].count + result;
  }, 0);

  if(current >= BORDERLINE) {
    io.emit(TARGET, `Target satisfied: ${current}`);
  } else {
    io.emit(TARGET, `Target not satisfied: ${current}`);
  }
};

const getCountry = (ip) => {
  axios.get(`http://ipinfo.io/${ip}/json`)
    .then(response => {
      let countryCode = response.data.country;
      console.log('countryCode:', countryCode);
      axios.get(`https://restcountries.eu/rest/v1/alpha/${countryCode}`)
	.then(response => {
	  let code = response.data.alpha3Code
	  let name = response.data.name.replace(/ /g, '+');
	  ip2Code[ip] = code;
	  console.log(counts);
	  if(code in counts) {
	    counts[code]['count']++;
	    checkTarget();
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
  let ip = cleanIP(req.ip);
  updateCount(ip);
  res.sendFile(path.join(__dirname,'public','index.html'));
});

io.on('connection', (socket) => {
  id2Ip[socket.id] = cleanIP(socket.handshake.address);
  socket.on('disconnect', () => {
    let ip = id2Ip[socket.id];
    let code = ip2Code[ip]
    console.log("---------------", code, "---------- DISCONNNECT");
    if(code in counts) {
      counts[code].count -= 1;
      checkTarget();
      io.emit(UPDATE, counts);
      console.log('connection closed', socket.id);
    }
  });  

});
