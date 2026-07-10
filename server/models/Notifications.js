const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    idPost: {
        type: String,
        required: true,
    },
    toIDs: {
        type: [String],
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    }
});


module.exports = mongoose.model('Notification', notificationSchema);

