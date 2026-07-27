const Pages = require('../models/Pages');

const createPages = async (req, res) => {
    const { tittle, email, password, imageProfile, idMaster, managedArea } = req.body;

    try {
        const existingPages = await Pages.findOne({ email });

        if (existingPages) {
            return res.status(400).json({ message: 'Email já cadastrado' });
        }

        const newPages = new Pages({ idMaster, tittle, email, password, imageProfile, managedArea });
        await newPages.save();
        
        res.status(201).json({ message: 'Pages registrado com sucesso' });
    }

    catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Erro ao registrar Pages', error });
    }
};

const getAllPages = async (req, res) => {
    try {
        const PagesList = await Pages.find();

        res.status(200).json(PagesList);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Erro ao buscar Pages', error });
    }
};

const getPagesById = async (req, res) => {
    const { id } = req.params;

    try {
        const pages = await Pages.findById(id);

        if (!pages) {
            return res.status(404).json({ message: 'Pages não encontrado' });
        }

        res.status(200).json(pages);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Erro ao buscar Pages', error });
    }
};

const updatePages = async (req, res) => {
    const { id } = req.params;
    const { tittle, email, password, imageProfile, managedArea } = req.body;

    try {
        const pages = await Pages.findById(id);

        if (!pages) {
            return res.status(404).json({ message: 'Pages não encontrado' });
        }

        pages.tittle = tittle || pages.tittle;
        pages.email = email || pages.email;
        pages.password = password || pages.password;
        pages.imageProfile = imageProfile || pages.imageProfile;
        pages.managedArea = managedArea || pages.managedArea;

        await pages.save();
        res.status(200).json({ message: 'Pages atualizado com sucesso', pages });
    }

    catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Erro ao atualizar Pages', error });
    }
};

const deletePages = async (req, res) => {
    const { id } = req.params;

    try {
        const pages = await Pages.findById(id);

        if (!pages) {
            return res.status(404).json({ message: 'Pages não encontrado' });
        }

        await pages.deleteOne();
        res.status(200).json({ message: 'Pages deletado com sucesso' });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Erro ao deletar Pages', error });
    }
};

const getPagesByMasterId = async (req, res) => {
    const { idMaster } = req.params;

    try {
        const PagesList = await Pages.find({ idMaster });

        res.status(200).json(PagesList);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Erro ao buscar Pages', error });
    }
};

module.exports = {
    createPages,
    getAllPages,
    getPagesById,
    updatePages,
    deletePages,
    getPagesByMasterId
};      