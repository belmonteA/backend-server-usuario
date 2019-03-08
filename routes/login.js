var express = require('express');
var bcrypt = require('bcryptjs');
// jason web token
var jwt = require('jsonwebtoken');

var SEED = require('../config/config').SEED;

var app = express();
var Usuario = require('../models/usuario');

//To validate an ID token (of Google)  in Node.js, 
// npm install google-auth-library --save

const { OAuth2Client } = require('google-auth-library');
// el CLIENT_ID, lo obtenemos de config/config.js, donde tenemos el CLIENT_ID que Google no asigna
var CLIENT_ID = require('../config/config').CLIENT_ID;
const client = new OAuth2Client(CLIENT_ID);


// =====================================
//  Autenticación de Google
// =====================================

async function verify(token) {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });
    // en el payload está toda la información del usuario
    const payload = ticket.getPayload();
    const userid = payload['sub'];
    // If request specified a G Suite domain:
    //const domain = payload['hd'];

    // este return es muy importante porque aqui devolvemos toda la data 
    return {
        nombre: payload.name,
        email: payload.email,
        img: payload.picture,
        google: true,
        payload
    };

}


// es obligatorio que await se ejecute dentro de una función async
app.post('/google', async(req, res) => {

    var token = req.body.token;

    var googleUser = await verify(token)
        .catch(e => {
            return res.status(403).json({
                ok: false,
                mensaje: 'Token no válido'

            });
        });


    Usuario.findOne({ email: googleUser.email }, (err, usuarioDB) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar usuario',
                errors: err
            });
        }
        // quiero almacenar en mi base de datos a este usuario
        // yo ya se que el usuario existe
        // comprobar si previamente se autenticó con google
        // en la tabla usuario tengo que crear una bandera/propiedad para esto
        // me indica si previamente se autenticó con google o no
        if (usuarioDB) {

            if (usuarioDB.google === false) {

                return res.status(500).json({
                    ok: false,
                    mensaje: 'Debe usar su autenticación normal',
                    errors: err
                });
                // usuario ya existe en mi base de datos y anteriormente fue autenticado por google
                // genero un nuevo token y mando la respuesta
            } else {
                var token = jwt.sign({ usuario: usuarioDB }, SEED, { expiresIn: 14400 }); // 4 horas

                res.status(200).json({
                    ok: true,
                    usuario: usuarioDB,
                    token: token,
                    id: usuarioDB._id
                });
            }
            // el usuario no existe. Hay que crearlo
        } else {
            var usuario = new Usuario();

            usuario.nombre = googleUser.nombre;
            usuario.email = googleUser.email;
            usuario.img = googleUser.img;
            usuario.google = true;
            usuario.password = ':)';

            // Ahora hay que grabarlo

            usuario.save((err, usuarioDB) => {

                var token = jwt.sign({ usuario: usuarioDB }, SEED, { expiresIn: 14400 }); // 4 horas

                res.status(200).json({
                    ok: true,
                    usuario: usuarioDB,
                    token: token,
                    id: usuarioDB._id
                });



            });


        }


    });


    // res.status(200).json({
    //     ok: true,
    //     mensaje: 'Ok  login/google',
    //     googleUser: googleUser
    // });

});


// =====================================
//  Autenticación normal
// =====================================


app.post('/', (req, res) => {

    var body = req.body;

    Usuario.findOne({ email: body.email }, (err, usuarioDB) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar usuario',
                errors: err
            });
        }

        if (!usuarioDB) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Credenciales incorrectas - email',
                errors: err
            });
        }

        if (!bcrypt.compareSync(body.password, usuarioDB.password)) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Credenciales incorrectas - password',
                errors: err
            });
        }

        // Crear un token!!!
        // para no mandar la contraseña en el token
        usuarioDB.password = ':)';

        var token = jwt.sign({ usuario: usuarioDB }, SEED, { expiresIn: 14400 }); // 4 horas

        res.status(200).json({
            ok: true,
            usuario: usuarioDB,
            token: token,
            id: usuarioDB._id
        });

    });
});
module.exports = app;