var express = require('express');

// instalamos la libreria express-fileupload
var fileUpload = require('express-fileupload');


var app = express();

// default options / middleware de fileupload
app.use(fileUpload());

// para usar la base de datos necesito importar el modelo
var Usuario = require('../models/usuario');
var Hospital = require('../models/hospital');
var Medico = require('../models/medico');


// para usar el sistema de archivos y borrar un archivo uso esta libreria
var fs = require('fs');


// petición básica sin parámetos
// app.put('/', (req, res, next) => {

// petición con parametros saber el tipo de colección y el Id del usuario, para formar el nombre de archivo

app.put('/:tipo/:id', (req, res, next) => {

    // obtengo los dos parámetros que recibo por el url y los asigno a variables para usarlos
    var tipo = req.params.tipo;
    var id = req.params.id;

    // validar los tipos
    var tiposValidos = ['usuarios', 'medicos', 'hospitales'];
    if (tiposValidos.indexOf(tipo) < 0) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Tipo de colección no válido',
            errors: { message: 'Los tipos válidos son ' + tiposValidos.join(', ') }
        });


    }

    // lo primero pregunto si vienen archivos
    if (!req.files) {
        return res.status(400).json({
            ok: false,
            mensaje: 'No seleccionó nada',
            errors: { message: 'Debe de seleccionar una imagen' }
        });
    }
    // validaciones
    // obtener nombre de archivo
    var archivo = req.files.imagen;
    //extraer la extension del archivo
    var nombreCortado = archivo.name.split('.');

    // buscamos la última posición del nombreCortado, para tener la extensión
    var extensionArchivo = nombreCortado[nombreCortado.length - 1];

    // Sólo estas extensiones aceptamos
    var extensionesValidas = ['png', 'jpg', 'gif', 'jpeg'];

    // validar que la extension del archivo exista en este arreglo
    if (extensionesValidas.indexOf(extensionArchivo) < 0) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Extensión no válida',
            errors: { message: 'Las extensiones válidas son ' + extensionesValidas.join(', ') }
        });
    }

    // nombre de archivo personalizado 123123123-444.png
    // contiene el Id del usuario, un guión y un numero random y la extensión
    // actualizo el app.put a (app.put('/tipo/:id', (req, res, next)))

    var nombreArchivo = `${ id }-${ new Date().getMilliseconds() }.${ extensionArchivo }`;

    // Mover el archivo del temporal a un path específico
    // Creamos una carpeta uploads para almacenar estos archivos

    var path = `./uploads/${ tipo }/${ nombreArchivo }`;

    archivo.mv(path, err => {

        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al mover el archivo',
                errors: err
            });

        }

        // El archivo ya está en nuestra carpeta uploads
        // para actualizar los registros en la base de datos

        subirPorTipo(tipo, id, nombreArchivo, res);




        // res.status(200).json({
        //     ok: true,
        //     mensaje: 'Archivo movido',
        //     nombreCortado,
        //     extensionArchivo

        // });

    });

});


function subirPorTipo(tipo, id, nombreArchivo, res) {

    if (tipo === 'usuarios') {

        //hago la busqueda por id, y recibo el callback (error y la respuesta)
        Usuario.findById(id, (err, usuario) => {

            if (!usuario) {

                return res.status(400).json({
                    ok: false,
                    mensaje: 'Usuario no existe',
                    errors: { message: 'Usuario no existes' }
                });
            }



            // path viejo de la imagen en caso de que tuviera una imagen subida
            var pathViejo = './uploads/usuarios/' + usuario.img;
            // si existe la imagen queda obsoleta. Tengo que borrarla 
            // para borrarla voy a usar un recurso filesystem. La importo al inicio 
            if (fs.existsSync(pathViejo)) {
                // elimina el archivo
                fs.unlinkSync(pathViejo);
            }
            // propiedad de la base de datos usuario, campo img
            usuario.img = nombreArchivo;
            // este es el usuario que recibo de Usuario.findById(id, (err, usuario))
            usuario.save((err, usuarioActualizado) => {

                //para que no muestre el password
                usuarioActualizado.password = ':)';

                return res.status(200).json({
                    ok: true,
                    mensaje: 'Imagen de usuario actualizada',
                    usuario: usuarioActualizado
                });


            });

        });

    }
    if (tipo === 'medicos') {

        //hago la busqueda por id, y recibo el callback (error y la respuesta)
        Medico.findById(id, (err, medico) => {

            if (!medico) {

                return res.status(400).json({
                    ok: false,
                    mensaje: 'Médico no existe',
                    errors: { message: 'Médico no existes' }
                });
            }

            // path viejo de la imagen en caso de que tuviera una imagen subida
            var pathViejo = './uploads/medicos/' + medico.img;
            // si existe la imagen queda obsoleta. Tengo que borrarla 
            // para borrarla voy a usar un recurso filesystem. La importo al inicio 
            if (fs.existsSync(pathViejo)) {
                // elimina el archivo
                fs.unlinkSync(pathViejo);
            }
            // propiedad de la base de datos medico, campo img
            medico.img = nombreArchivo;
            // este es el medico que recibo de Medico.findById(id, (err, medico))
            medico.save((err, medicoActualizado) => {

                return res.status(200).json({
                    ok: true,
                    mensaje: 'Imagen de médico actualizada',
                    medico: medicoActualizado
                });


            });

        });

    }
    if (tipo === 'hospitales') {

        //hago la busqueda por id, y recibo el callback (error y la respuesta)
        Hospital.findById(id, (err, hospital) => {

            if (!hospital) {

                return res.status(400).json({
                    ok: false,
                    mensaje: 'Hospital no existe',
                    errors: { message: 'Hospital no existe' }
                });
            }

            // path viejo de la imagen en caso de que tuviera una imagen subida
            var pathViejo = './uploads/hospitales/' + hospital.img;
            // si existe la imagen queda obsoleta. Tengo que borrarla 
            // para borrarla voy a usar un recurso filesystem. La importo al inicio 
            if (fs.existsSync(pathViejo)) {
                // elimina el archivo
                fs.unlinkSync(pathViejo);
            }
            // propiedad de la base de datos hospital, campo img
            hospital.img = nombreArchivo;
            // este es el medico que recibo de Medico.findById(id, (err, medico))
            hospital.save((err, hospitalActualizado) => {


                return res.status(200).json({
                    ok: true,
                    mensaje: 'Imagen de hospital actualizada',
                    hospital: hospitalActualizado
                });


            });

        });


    }

}


module.exports = app;