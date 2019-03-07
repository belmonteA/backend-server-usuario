var express = require('express');

var app = express();

// libreria que nos ayuda con el path para localizar archivos. Ya viene con node no hay que hacer nada más
const path = require('path');
// para manejar los archivos. Filesystem
const fs = require('fs');


app.get('/:tipo/:img', (req, res, next) => {

    // obtengo los dos parámetros que recibo por el url y los asigno a variables para usarlos
    var tipo = req.params.tipo;
    var img = req.params.img;

    // buscamos la imagenes que tenemos en nuestro filesystem, si no hay ninguna mostramos una por defecto
    // __dirname -> toda la ruta del servidor o donde esté desplegada la aplicación
    var pathImagen = path.resolve(__dirname, `../uploads/${ tipo }/${ img }`);

    // verificar si la imagen existe 

    if (fs.existsSync(pathImagen)) {

        res.sendFile(pathImagen);
    } else {

        var pathNoImagen = path.resolve(__dirname, `../assets/no-img.jpg`);
        res.sendFile(pathNoImagen);
    }

});

module.exports = app;