//Our mongoDb URI to connect to our database below
//mongodb+srv://yoshi1:<teamyoshi>@cluster0.jf7rx.mongodb.net/myFirstDatabase?retryWrites=true&w=majority
var express = require('express');
var app = express();
var db = require('./db');
module.exports = app;
var DriverController = require('./DriverController');
app.use('/drivers', DriverController);
var RiderController = require('./RiderController');
app.use('/riders', RiderController);

//Google distance API variable is here, call on this when using.
//https://www.npmjs.com/package/google-distance  <-- API's data page has good examples
var googleDist = require('google-distance')
/**  EXAMPLE: distance.get(
  {
    origin: 'San Francisco, CA',
    destination: 'San Diego, CA'
  },
  function(err, data) {
    if (err) return console.log(err);
    console.log(data);
});
The above example code returns JavaScript object data that we can store into the rider/driver objects.
*/

//Main loop here:
function main() {
    

}


main();