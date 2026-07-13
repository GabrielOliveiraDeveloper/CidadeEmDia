const Subs = require('../models/Subs');

const createSubs = async (req, res) => {
    const { tittle, email, password, imageProfile, idMaster, managedArea } = req.body;

    try {
        const existingSubs = await Subs.findOne({ email });

        if (existingSubs) {
            return res.status(400).json({ message: 'Email já cadastrado' });
        }

        const newSubs = new Subs({ idMaster, tittle, email, password, imageProfile, managedArea });
        await newSubs.save();
        
        res.status(201).json({ message: 'Subs registrado com sucesso' });
    }

    catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Erro ao registrar subs', error });
    }
};

const getAllSubs = async (req, res) => {
    try {
        const subsList = await Subs.find();

        res.status(200).json(subsList);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Erro ao buscar subs', error });
    }
};

const getSubsById = async (req, res) => {
    const { id } = req.params;

    try {
        const subs = await Subs.findById(id);

        if (!subs) {
            return res.status(404).json({ message: 'Subs não encontrado' });
        }

        res.status(200).json(subs);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Erro ao buscar subs', error });
    }
};

const updateSubs = async (req, res) => {
    const { id } = req.params;
    const { tittle, email, password, imageProfile, managedArea } = req.body;

    try {
        const subs = await Subs.findById(id);

        if (!subs) {
            return res.status(404).json({ message: 'Subs não encontrado' });
        }

        subs.tittle = tittle || subs.tittle;
        subs.email = email || subs.email;
        subs.password = password || subs.password;
        subs.imageProfile = imageProfile || subs.imageProfile;
        subs.managedArea = managedArea || subs.managedArea;

        await subs.save();
        res.status(200).json({ message: 'Subs atualizado com sucesso', subs });
    }

    catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Erro ao atualizar subs', error });
    }
};

const deleteSubs = async (req, res) => {
    const { id } = req.params;

    try {
        const subs = await Subs.findById(id);

        if (!subs) {
            return res.status(404).json({ message: 'Subs não encontrado' });
        }

        await subs.deleteOne();
        res.status(200).json({ message: 'Subs deletado com sucesso' });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Erro ao deletar subs', error });
    }
};

const getSubsByMasterId = async (req, res) => {
    const { idMaster } = req.params;

    try {
        const subsList = await Subs.find({ idMaster });

        res.status(200).json(subsList);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Erro ao buscar subs', error });
    }
};

module.exports = {
    createSubs,
    getAllSubs,
    getSubsById,
    updateSubs,
    deleteSubs,
    getSubsByMasterId
};      