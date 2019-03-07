var express = require('express');

var app = express();

// para buscar en hospitales hay que importar el modelo
var Hospital = require('../models/hospital');

// para buscar en varias collectiones. Creamos procesos asincronos y esperamos que todos terminen
// y entonces damos la respuesta. Transformamos las respuestas en promesas.


var Medico = require('../models/medico');

// con los usuarios vamos a buscar en dos columnas

var Usuario = require('../models/usuario');


// para buscar en varias colleciones, hacemos promesas
// busqueda en las tres tablas que tenemos
app.get('/todo/:busqueda', (req, res, next) => {

    // extraemos el parametro de busqueda
    var busqueda = req.params.busqueda;
    // creamos una expresion regular para la busqueda. Mando la busqueda y quiero que insensible a M y m
    var regex = new RegExp(busqueda, 'i');

    // nos permite mandar un arreglo de promesas, si todas responden favorablemente podemos dispara el
    // .then sino el catch

    Promise.all([buscarHospitales(busqueda, regex),
            buscarMedicos(busqueda, regex),
            buscarUsuarios(busqueda, regex),
            buscarHospitales2(busqueda, regex),
            buscarMedicos2(busqueda, regex)
        ]) // devuelve un arreglo con la respuesta 
        .then(respuestas => {

            res.status(200).json({
                ok: true,
                mensaje: 'Petición realizada a BUSQUEDA',
                hospitales: respuestas[0],
                medicos: respuestas[1],
                usuarios: respuestas[2],
                hospitales2: respuestas[3],
                medicos2: respuestas[4]

            });
        });
});


function buscarHospitales(busqueda, regex) {


    return new Promise((res, rej) => {

        Hospital.find({ nombre: regex }, (err, hospitales) => {

            if (err) {
                rej('Error al cargar hospitales', err);
            } else {
                // si todo va bien manda la data
                res(hospitales);
            }

        });

    });

};

// buscar hospitales con populate

function buscarHospitales2(busqueda, regex) {


    return new Promise((res, rej) => {

        Hospital.find({ nombre: regex })
            .populate('usuario', 'nombre email')
            .exec((err, hospitales) => {

                if (err) {
                    rej('Error al cargar hospitales', err);
                } else {
                    // si todo va bien manda la data
                    res(hospitales);
                }

            });

    });

};


function buscarMedicos(busqueda, regex) {


    return new Promise((res, rej) => {

        Medico.find({ nombre: regex }, (err, medicos) => {

            if (err) {
                rej('Error al cargar medicos', err);
            } else {
                // si todo va bien manda la data
                res(medicos);
            }

        });

    });

};


// con populate 

function buscarMedicos2(busqueda, regex) {

    return new Promise((res, rej) => {

        Medico.find({ nombre: regex })
            .populate('usuario', 'nombre email')
            .populate('hospital')
            .exec((err, medicos) => {

                if (err) {
                    rej('Error al cargar medicos', err);
                } else {
                    // si todo va bien manda la data
                    res(medicos);
                }

            });

    });

};


function buscarUsuarios(busqueda, regex) {


    return new Promise((res, rej) => {
        // buscamos en dos columnas de Usuario

        Usuario.find({}, 'nombre email role')
            .or([{ 'nombre': regex }, { 'email': regex }])
            .exec((err, usuarios) => {

                if (err) {
                    rej('Error al cargar usuarios', err);
                } else {
                    // si todo va bien manda la data
                    res(usuarios);
                }


            });
    });

};

// =============================
//  Busqueda por colección
// ==============================
app.get('/coleccion/:tabla/:busqueda', (req, res, next) => {

    var tabla = req.params.tabla;
    var busqueda = req.params.busqueda;

    // creamos una expresion regular para la busqueda. Mando la busqueda y quiero que insensible a M y m
    var regex = new RegExp(busqueda, 'i');

    var promesa;

    switch (tabla) {

        case 'usuarios':
            promesa = buscarUsuarios(busqueda, regex);
            break;
        case 'hospitales':
            promesa = buscarHospitales(busqueda, regex);
            break;
        case 'medicos':
            promesa = buscarMedicos(busqueda, regex);
            break;
        default:
            return res.status(400).json({
                ok: false,
                mensaje: 'Los tipos de busqueda son: usuarios, medicos y hospitales',
                error: { message: 'Tipo de tabla / colección no válido' }
            });



    }

    promesa.then(data => {
        res.status(200).json({
            ok: true,
            [tabla]: data


        });


    });

});

module.exports = app;