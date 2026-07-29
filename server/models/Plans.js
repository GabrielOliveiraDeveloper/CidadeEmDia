const mongoose = require('mongoose');

const plansSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    benefits: {
        type: [String],
        required: true,
    }
});

const Plans = mongoose.model('Plans', plansSchema);
module.exports = Plans;