const notification = require('../models/Notifications');

const getNotifications = async (req, res) => {
    const {id} = req.params;


    try {
        const notifications = await notification.find({toIDs: id}).sort({date: -1});
        res.status(200).json(notifications);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Erro ao buscar notificações', error });
    }
}


module.exports = { getNotifications };