const mongoose = require('mongoose');

const connectToDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB);
        console.log('Conectado ao MongoDB');
    }
    catch (error) {
        console.error('Erro ao conectar ao MongoDB:', error);
    }
};

module.exports = connectToDB;