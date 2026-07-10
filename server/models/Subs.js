const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const subsSchema = new mongoose.Schema({
    idMaster: {
        type: String,
        required: true,
    },
    tittle: {
        type: String,
        required: true,
    }, 
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    imageProfile: {
        type: String,
        required: false,
    },
    managedArea: {
        type: String,
        required: true,
    }
});

subsSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

subsSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    }
    catch (error) {
        throw error;
    }
};

const Subs = mongoose.model('Subs', subsSchema);

module.exports = Subs;