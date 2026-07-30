const routes = require('express').Router();
const { registerController, loginController, registerMaster } = require('../controllers/authcontrollers');
const { createSubs, getAllSubs, getSubsById, updateSubs } = require('../controllers/subsControllers');
const notificationController = require('../controllers/Notifications');
const pageController = require('../controllers/PageControllers');
const Post = require('../models/Post');


routes.post('/updateposttobunner/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        post.isBanner = true;
        await post.save();

        res.status(200).json({ message: 'Post updated to banner successfully', post });
    } catch (error) {
        res.status(500).json({ message: 'Error updating post to banner', error });
    }
});

routes.post('/pages', pageController.createPages);
routes.get('/pages', pageController.getAllPages);
routes.get('/pages/:id', pageController.getPagesById);
routes.put('/pages/:id', pageController.updatePages);
routes.delete('/pages/:id', pageController.deletePages);

routes.post('/subs', createSubs);
routes.get('/subs', getAllSubs);
routes.get('/subs/:id', getSubsById);
routes.put('/subs/:id', updateSubs);
routes.delete('/subs/:id', require('../controllers/subsControllers').deleteSubs);
routes.get('/subs/master/:idMaster', require('../controllers/subsControllers').getSubsByMasterId);
routes.post('/register', registerController);
routes.post('/login', loginController);
routes.post('/register-master', registerMaster);
routes.post('/payment', require('../controllers/paymentController'));
routes.post('/posts', require('../controllers/postsController').createPost);
routes.get('/posts', require('../controllers/postsController').getPosts);
routes.get('/posts/user/:id', require('../controllers/postsController').getPostsByUser);
routes.delete('/posts/:id', require('../controllers/postsController').deletePost);
routes.get('/areas/:city', require('../controllers/postsController').getManagedAreaByCity);
routes.get('/notifications/:id', notificationController.getNotifications);
routes.get('/posts/:id', require('../controllers/postsController').getPostByID);

routes.get('/getUserByID/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const user = await require('../models/User').findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching user', error });
    }
});

routes.get('/getMastersByID/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const master = await require('../models/Master').findById(id);

        if (!master) {
            return res.status(404).json({ message: 'Master not found' });
        }

        res.json(master);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching master', error });
    }
});

routes.get('/returnAllMasters', async (req, res) => {
    try {
        const masters = await require('../models/Master').find();

        res.json(masters);

    } catch (error) {

        res.status(500).json({ message: 'Error fetching masters', error });
    }
})

routes.get('/returnAllUsers', async (req, res) => {
    try {
        const users = await require('../models/User').find();

        res.json(users);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching users', error });
    }
});

const MidiaHome = require('../models/MidiaHome');

routes.post('/midia-home', async (req, res) => {
    const { url, isImage } = req.body
    
    const newMidia = new MidiaHome({ url, isImage });

    try {
        const savedMidia = await newMidia.save();
        res.status(201).json(savedMidia);
    } catch (error) {
        res.status(500).json({ message: 'Error saving media', error });
    }

})

routes.get('/midia-home', async (req, res) => {
    try {
        const midias = await MidiaHome.find();
        res.status(200).json(midias);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching media', error });
    }
});

routes.delete('/midia-home/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const deletedMidia = await MidiaHome.findByIdAndDelete(id);

        if (!deletedMidia) {
            return res.status(404).json({ message: 'Media not found' });
        }

        res.status(200).json({ message: 'Media deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting media', error });
    }
});

const Plans = require('../models/Plans');

routes.post('/plans', async (req, res) => {
    const { name, price, benefits } = req.body;

    // 1. Trata e converte o preço para número (substitui vírgula por ponto, se houver)
    const numericPrice = Number(String(price).replace(',', '.'));

    // 2. Mapeia 'name' vindo do req.body para o campo 'title' do Schema
    const newPlan = new Plans({ 
        title: name, 
        price: numericPrice, 
        benefits 
    });

    try {
        const savedPlan = await newPlan.save();
        res.status(201).json(savedPlan);
    } catch (error) {
        // Retorna status 400 se for erro de validação do Mongoose
        res.status(400).json({ message: 'Erro ao validar ou salvar plano', error: error.message });
    }
});

routes.get('/plans', async (req, res) => {
    try {
        const plans = await Plans.find();
        res.status(200).json(plans);
    }

    catch (error) {
        res.status(500).json({ message: 'Error fetching plans', error });
    }

});

routes.delete('/plans/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const deletedPlan = await Plans.findByIdAndDelete(id);

        if (!deletedPlan) {
            return res.status(404).json({ message: 'Plan not found' });
        }

        res.status(200).json({ message: 'Plan deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting plan', error });
    }

});




module.exports = routes;