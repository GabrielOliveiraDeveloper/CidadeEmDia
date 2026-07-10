const { MercadoPagoConfig, Preference } = require('mercadopago');

const payment =  async (req, res) => {
    const client = new MercadoPagoConfig({ accessToken: process.env.ACESS_TOKEN});
    
    const preference = new Preference(client);
    
    const body = {
        items: [
            {
            id: '1234',
            title: 'plan',
            quantity: 1,
            currency_id: 'BRL',
            unit_price: 90,
            },
        ]
    };


    await preference.create({body}).then((response)=>{
        res.send(response.init_point);
    });

}

module.exports = payment;