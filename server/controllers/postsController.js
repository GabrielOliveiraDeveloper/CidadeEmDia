const Post = require('../models/Post'); // Certifique-se de que no model está usando: module.exports = mongoose.model('Post', postSchema);
const Master = require('../models/Master');
const Subs = require('../models/Subs');
const Notification = require('../models/Notifications');

const createPost = async (req, res) => {
    try {
        const { id, protocol, cep, city, photos, description, managedArea } = req.body;
        
        const newPost = new Post({ 
            idUser: id, 
            protocol, 
            CEP: cep, 
            city, 
            photos, 
            description,
            managedArea
        });
        
        const postSalvo = await newPost.save();

        const mastersEncontrados = await Master.find({
            city: city,
            $or: [
                { managedArea: managedArea },
                { managedArea: 'master' } 
            ]
        }).select('_id');

        const mastersDaCidade = await Master.find({ city: city }).select('_id');
        const idsMastersDaCidade = mastersDaCidade.map(m => m._id.toString());

        const subsEncontrados = await Subs.find({
            idMaster: { $in: idsMastersDaCidade },
            managedArea: managedArea
        }).select('_id');

        const toIDsSet = new Set([
            ...mastersEncontrados.map(m => m._id.toString()),
            ...subsEncontrados.map(s => s._id.toString())
        ]);
        const toIDs = Array.from(toIDsSet);

        if (toIDs.length > 0) {
            const newNotification = new Notification({
                idPost: postSalvo._id.toString(),
                toIDs: toIDs
            });
            await newNotification.save();
        }
    
        return res.status(201).json(postSalvo);
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Erro ao criar post', error: error.message });
    }
};

const getPosts = async (req, res) => {
    try {
        const posts = await Post.find();
        return res.status(200).json(posts);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Erro ao buscar posts', error: error.message });
    }
};

const deletePost = async (req, res) => {
    try {
        const { id } = req.params;
        
        const deletado = await Post.findByIdAndDelete(id);
        if (!deletado) {
            return res.status(404).json({ message: 'Ocorrência não encontrada' });
        }

        return res.status(200).json({ message: 'Post deletado com sucesso' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Erro ao deletar post', error: error.message });
    }
};

const getPostsByUser = async (req, res) => {
    try {
        const { id } = req.params;

        const posts = await Post.find({ idUser: id });
        return res.status(200).json(posts);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Erro ao buscar posts do usuário', error: error.message });
    }

};

const getManagedAreaByCity = async (req, res) => {
    try {
        const city = req.params.city || req.query.city;

        if (!city) {
            return res.status(400).json({ message: 'O parâmetro cidade é obrigatório.' });
        }

        const masters = await Master.find({ 
            city: { $regex: new RegExp(`^${city}$`, 'i') } 
        });

        if (!masters || masters.length === 0) {
            return res.status(200).json([]);
        }

        const masterIds = masters.map(m => m._id.toString());

        const subs = await Subs.find({ idMaster: { $in: masterIds } });

        const areasSet = new Set();

        masters.forEach(m => {
            if (m.managedArea) {
                areasSet.add(m.managedArea.trim());
            }
        });

        subs.forEach(s => {
            if (s.managedArea) {
                areasSet.add(s.managedArea.trim());
            }
        });

        const managedAreasDisponiveis = Array.from(areasSet).filter(
            area => area.toLowerCase() !== 'master'
        );

        return res.status(200).json(managedAreasDisponiveis);

    } catch (error) {
        console.error('Erro ao buscar áreas gerenciadas:', error);
        return res.status(500).json({ 
            message: 'Erro interno ao buscar áreas gerenciadas por cidade', 
            error: error.message 
        });
    }
};

const getPostByID = async (req, res) => {
    const { id } = req.params;

    try {
        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({ message: 'Post não encontrado' });
        }

        return res.status(200).json(post);
    } catch {
        console.log(error);
        return res.status(500).json({ message: 'Erro ao buscar post', error: error.message });
    }
}

module.exports = {
    createPost,
    getPosts,
    deletePost,
    getPostsByUser,
    getManagedAreaByCity,
    getPostByID
};