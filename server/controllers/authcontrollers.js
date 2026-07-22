const nodemailer = require('nodemailer');
const User = require('../models/User');
const Master = require('../models/Master');
const Subs = require('../models/Subs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const sendWelcomeEmail = async (to, userName) => {
    const port = Number(process.env.EMAIL_PORT) || 587;

    let transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: 465,
        secure: true, // true para 465 (SSL), false para 587 (TLS)
        auth: {
            user: process.env.EMAIL_USER || 'sendermailservice01@gmail.com',
            pass: process.env.EMAIL_PASS || 'slht vdcm pfgi mmru'
        },
        connectionTimeout: 10000, // Evita que o Node.js fique esperando infinitamente
        greetingTimeout: 10000,
        socketTimeout: 10000
    });

    let mailOptions = {
        from: process.env.EMAIL_USER || 'sendermailservice01@gmail.com',
        to: to,
        subject: 'Sua conta foi criada com sucesso! - Cidadeemdia',
        text: `Olá ${userName},\n\nSua conta foi criada com sucesso na plataforma Cidadeemdia! Seja muito bem-vindo(a).\n\nAtenciosamente,\nEquipe Cidadeemdia`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email enviado com sucesso para ${to}`);
    } catch (error) {
        console.error(`Erro ao enviar email para ${to}:`, error);
    }
};

const registerController = async ( req, res ) => {
    const { name, email, tel, imageProfile, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email já cadastrado' });
        }

        const newUser = new User({ name, email, tel, imageProfile, password });
        await newUser.save();

        // Envia em segundo plano sem travar o cadastro
        sendWelcomeEmail(email, name);

        res.status(201).json({ message: 'Usuário registrado com sucesso' });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Erro ao registrar usuário', error });
    }
}

const loginController = async (req, res) => {
    const { email, password } = req.body;

    try {
        let account = await User.findOne({ email });
        let role = 'user';

        if (!account) {
            account = await Master.findOne({ email });
            role = 'master';
        }

        if (!account) {
            account = await Subs.findOne({ email });
            role = 'subs';
        }

        if (!account) {
            return res.status(400).json({ message: 'Email ou senha inválidos' });
        }

        const isMatch = await account.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Email ou senha inválidos' });
        }

        const token = jwt.sign(
            { id: account._id, role: role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' }
        );

        res.status(200).json({ 
            message: 'Login bem-sucedido', 
            token, 
            id: account._id,
            role: role 
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Erro ao fazer login', error: error.message });
    }
};

const registerMaster = async ( req, res ) => {
    const { tittle, CPForCNPJ, email, imageProfile, state, city, managedArea, password } = req.body;

    try {
        const existingMaster = await Master.findOne({ email });

        if (existingMaster) {
            return res.status(400).json({ message: 'Email já cadastrado' });
        }

        const newMaster = new Master({ tittle, CPForCNPJ, email, imageProfile, state, city, managedArea, password });
        await newMaster.save();

        // Envia em segundo plano sem travar o cadastro
        sendWelcomeEmail(email, tittle);

        res.status(201).json({ message: 'Master registrado com sucesso' });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Erro ao registrar master', error });
    }
}

module.exports = {
    registerController,
    loginController,
    registerMaster
};