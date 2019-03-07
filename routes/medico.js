var express = require('express');

var mdAutenticacion = require('../middlewares/autenticacion');

var app = express();

var Medico = require('../models/medico');

// ==========================================
// Obtener todos los médicos
// ==========================================
app.get('/', (req, res, next) => {

    // para paginación
    var desde = req.query.desde || 0;
    desde = Number(desde);


    // le digo que los campos que quiero que me muestre en la consulta
    Medico.find({}, 'nombre img usuario hospital')
        .populate('usuario', 'nombre email')
        .populate('hospital')
        .skip(desde)
        .limit(5)
        .exec(
            (err, medicos) => {

                if (err) {
                    return res.status(500).json({
                        ok: false,
                        mensaje: 'Error cargando medico',
                        errors: err
                    });
                }

                Medico.count({}, (err, conteo) => {

                    res.status(200).json({
                        ok: true,
                        medicos: medicos,
                        total: conteo

                    });

                });

            });
});


// ==========================================
// Actualizar médico
// ==========================================
app.put('/:id', mdAutenticacion.verificaToken, (req, res) => {

    // app.put('/:id', (req, res) => {

    var id = req.params.id;
    var body = req.body;

    Medico.findById(id, (err, medico) => {


        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar médico',
                errors: err
            });
        }

        if (!medico) {
            return res.status(400).json({
                ok: false,
                mensaje: 'El medico con el id ' + id + ' no existe',
                errors: { message: 'No existe un médico con ese ID' }
            });
        }


        medico.nombre = body.nombre;
        medico.usuario = body.usuario;
        medico.hospital = body.hospital;

        medico.save((err, medicoGuardado) => {

            if (err) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al actualizar médico',
                    errors: err
                });
            }

            //     hospitalGuardado.password = ':)';

            res.status(200).json({
                ok: true,
                medico: medicoGuardado
            });

        });

    });


});


// ==========================================
// Crear un nuevo médico
// ==========================================
app.post('/', mdAutenticacion.verificaToken, (req, res) => {

    // app.post('/', (req, res) => {

    var body = req.body;


    var medico = new Medico({
        nombre: body.nombre,
        img: body.img,
        usuario: body.usuario,
        hospital: body.hospital
    });

    medico.save((err, medicoGuardado) => {

        if (err) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al crear médico',
                errors: err
            });
        }

        res.status(201).json({
            ok: true,
            medico: medicoGuardado,
            //    medicotoken: req.medico
        });


    });

});


// ============================================
//   Borrar un médico por el id
// ============================================
app.delete('/:id', mdAutenticacion.verificaToken, (req, res) => {

    var id = req.params.id;

    Medico.findByIdAndRemove(id, (err, medicoGuardado) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error borrar médico',
                errors: err
            });
        }

        if (!medicoGuardado) {
            return res.status(400).json({
                ok: false,
                mensaje: 'No existe un médico con ese id',
                errors: { message: 'No existe un médico con ese id' }
            });
        }

        res.status(200).json({
            ok: true,
            medico: medicoGuardado
        });

    });

});
module.exports = app;