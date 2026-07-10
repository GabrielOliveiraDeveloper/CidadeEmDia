const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    idUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    protocol: {
        type: String,
        required: true
    }, 
    CEP: {
        type: String,
        required: true
    },
    city:{
        type: String,
        required: true
    },
    photos: {
        type: [String],
        required: false
    },
    description: {
        type: String,
        required: true
    },
    managedArea: {
        type: String,
        required: true
    }
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;