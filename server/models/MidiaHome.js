const mongoose = require('mongoose');

const midiaHomeSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true,
    },

    isImage: {
        type: Boolean,
        required: true,
    }
});

const MidiaHome = mongoose.model('MidiaHome', midiaHomeSchema);

module.exports = MidiaHome;