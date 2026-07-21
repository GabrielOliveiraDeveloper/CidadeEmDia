const nodemailer = require('nodemailer');
const User = require('../models/User');
const Master = require('../models/Master');
const Subs = require('../models/Subs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

/**
 * Função auxiliar para enviar e-mail de boas-vindas via Nodemailer
 * @param {string} to - E-mail do destinatário
 * @param {string} userName - Nome do usuário cadastrado
 */
const sendWelcomeEmail = async (to, userName) => {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT) || 465,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const subject = 'Sua conta foi criada com sucesso! - Cidadeemdia';
    const text = `Olá ${userName},\n\nSua conta foi criada com sucesso na plataforma Cidadeemdia! Seja muito bem-vindo(a).\n\nAtenciosamente,\nEquipe Cidadeemdia`;

    // Template de e-mail estilizado com design em Verde (#2e7d32 / #4caf50) e Branco
    const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Boas-vindas ao Cidadeemdia</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #f4f7f6;
                margin: 0;
                padding: 0;
            }
            .email-container {
                max-width: 600px;
                margin: 30px auto;
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                border: 1px solid #e0e0e0;
            }
            .email-header {
                background-color: #2e7d32;
                color: #ffffff;
                padding: 30px 20px;
                text-align: center;
            }
            .email-header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 700;
                letter-spacing: 1px;
            }
            .email-body {
                padding: 35px 30px;
                color: #333333;
                line-height: 1.6;
            }
            .email-body h2 {
                color: #2e7d32;
                margin-top: 0;
                font-size: 22px;
            }
            .welcome-card {
                background-color: #e8f5e9;
                border-left: 4px solid #4caf50;
                padding: 15px 20px;
                margin: 20px 0;
                border-radius: 0 6px 6px 0;
            }
            .welcome-card p {
                margin: 0;
                color: #1b5e20;
                font-size: 15px;
            }
            .email-footer {
                background-color: #f8f9fa;
                text-align: center;
                padding: 20px;
                font-size: 13px;
                color: #777777;
                border-top: 1px solid #eeeeee;
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="email-header">
                <h1>Cidadeemdia</h1>
            </div>
            <div class="email-body">
                <h2>Olá, ${userName}!</h2>
                <div class="welcome-card">
                    <p><strong>Sua conta foi criada com sucesso!</strong></p>
                </div>
                <p>Seja muito bem-vindo(a) à plataforma <strong>Cidadeemdia</strong>.</p>
                <p>Sua conta está ativa e pronta para uso. Agora você pode aproveitar todas as funcionalidades e recursos disponíveis na nossa plataforma.</p>
                <p>Se você tiver alguma dúvida ou precisar de assistência, não hesite em entrar em contato com nossa equipe de suporte.</p>
            </div>
            <div class="email-footer">
                &copy; ${new Date().getFullYear()} Cidadeemdia. Todos os direitos reservados.
            </div>
        </div>
    </body>
    </html>
    `;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        text,
        html,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email enviado para ${to}`);
    }
    catch (error) {
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

        // Envio do e-mail automático de boas-vindas
        await sendWelcomeEmail(email, name);

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

        // Envio do e-mail automático de boas-vindas
        await sendWelcomeEmail(email, tittle);

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