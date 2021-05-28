var mongoose = require('mongoose');  

//This JS file creates a rider layout or schema in the database.
var RiderSchema = new mongoose.Schema({  
    firstName: String,
    lastName: String,
    id: String,
    location: {
       lat: String, 
       lon: String
    },
    destination: String,
    assignedDriver:  String
});
mongoose.model('Rider', RiderSchema);
module.exports = mongoose.model('Rider');