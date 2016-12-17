import express from 'express';
import socketio from 'socket.io';
import axios from 'axios';
import fisl from 'first-image-search-load';

const app = express();

app.set('port', process.env.PORT || 3005);

const server = app.listen(app.get('port'), () => {
  console.log('Server listening on port', app.get('port'));
});

const io = socketio(server);

const address = {};
const country = {};

const updateCount = (ip) => {
  let idx = ip.lastIndexOf(':');
  ip = ip.substr(idx+1);
  address[ip] = (address[ip] || 0) + 1;
  getCountry(ip);
}

const getFlag = (cntry) => {
  let url = `https://www.google.com/search?q=country+${cntry}+flag+image`;
  fisl.getFirstImageURL(url)
    .then(function(imgUrl) {
      console.log(imgUrl);
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
	  console.log('country code data:', response);
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
