const routes = require('express').Router();
const { registerController, loginController, registerMaster } = require('../controllers/authcontrollers');
const { createSubs, getAllSubs, getSubsById, updateSubs } = require('../controllers/subsControllers');
const notificationController = require('../controllers/Notifications');
const pageController = require('../controllers/PageControllers');

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

module.exports = routes;