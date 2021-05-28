var mongoose = require('mongoose');  

//This JS file creates a driver layout or schema in the database.
var DriverSchema = new mongoose.Schema({  
    firstName: String,
    lastName: String,
    location: {
       lat: String, 
       lon: String
    },
    available: Boolean,
    assignedRider: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Rider' }],
    averageRating : Number,
    numberOfRatings : Number
});
mongoose.model('Driver', DriverSchema);
module.exports = mongoose.model('Driver');