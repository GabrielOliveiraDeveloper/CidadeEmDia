const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const masterSchema = new mongoose.Schema({
    tittle: {
        type: String,
        required: true,
    },
    CPForCNPJ: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    imageProfile: {
        type: String,
        required: false,
    },
    state: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
    managedArea: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
});

masterSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

masterSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    }
    catch (error) {
        throw error;
    }
    
};

const Master = mongoose.model('Master', masterSchema);

module.exports = Master;