import express from 'express';
import socketio from 'socket.io';
import axios from 'axios';
import gis from 'g-image-search';

const app = express();

app.set('port', process.env.PORT || 3005);

const server = app.listen(app.get('port'), () => {
  console.log('Server listening on port', app.get('port'));
});

const io = socketio(server);

const address = {};
const counts = {};

const updateCount = (ip) => {
  let idx = ip.lastIndexOf(':');
  ip = ip.substr(idx+1);
  address[ip] = (address[ip] || 0) + 1;
  getCountry(ip);
}

const getFlag = (cntry) => {
  let query = `${cntry}+flag`;
  gis(query).then(results => {
      console.log(results[1]);
    })
    .catch(error => {
      console.log('error:', error);
    });
}

const getCountry = (ip) => {
  axios.get(`http://ipinfo.io/${ip}/json`)
    .then(response => {
      let countryCode = response.data.country;
      axios.get(`https://restcountries.eu/rest/v1/alpha/${countryCode}`)
	.then(response => {
	  console.log('country code data:', response.data);
	  let code = response.data.alpha3Code
	  let name = response.data.name.replace(/ /g, '+');
	  counts[code] = (counts[code] || 0) + 1; 
	  let query = code + '+' + name;
	  console.log('query:', query);
	  getFlag(query);
	});
      //country[cntry] = (country[cntry] || 0) + 1;
      //getFlag(cntry);
    })
    .catch(error => {
      console.log('error:', error);
    });
}

app.get('/', (req, res) => {
  updateCount(req.ip);
  res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', (socket) => {
  console.log('new connection');
  console.log(address);
  socket.on('disconnect', () => {
    console.log('connection closed');
  });  

});
