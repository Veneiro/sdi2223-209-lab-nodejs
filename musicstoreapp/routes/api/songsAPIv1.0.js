const {ObjectId} = require("mongodb");
const {validationResult} = require('express-validator')
const {songValidatorInsert, songValidatorUpdate} = require('./songsValidator')
module.exports = function (app, songsRepository, usersRepository) {
    app.get("/api/v1.0/songs", function (req, res) {
        let filter = {};
        let options = {};
        songsRepository.getSongs(filter, options).then(songs => {
            res.status(200);
            res.send({songs: songs})
        }).catch(error => {
            res.status(500);
            res.json({error: "Se ha producido un error al recuperar las canciones."})
        });
    });
    app.get("/api/v1.0/songs/:id", function (req, res) {
        try {
            let songId = ObjectId(req.params.id)
            let filter = {_id: songId};
            let options = {};
            songsRepository.findSong(filter, options).then(song => {
                if (song === null) {
                    res.status(404);
                    res.json({error: "ID inválido o no existe"})
                } else {
                    res.status(200);
                    res.json({song: song})
                }
            }).catch(error => {
                res.status(500);
                res.json({error: "Se ha producido un error a recuperar la canción."})
            });
        } catch (e) {
            res.status(500);
            res.json({error: "Se ha producido un error :" + e})
        }
    });
    app.delete('/api/v1.0/songs/:id', function (req, res) {
        try {
            let songId = ObjectId(req.params.id)
            let filter = {_id: songId}
            validateUser(req.body.author, req.session.user, function (errors) {
                if (errors !== null && errors.length > 0) {
                    res.status(422);
                    res.json({errors: errors})
                } else {
                    songsRepository.deleteSong(filter, {}).then(result => {
                        if (result === null || result.deletedCount === 0) {
                            res.status(404);
                            res.json({error: "ID inválido o no existe, no se ha borrado el registro."});
                        } else {
                            res.status(200);
                            res.send(JSON.stringify(result));
                        }
                    }).catch(error => {
                        res.status(500);
                        res.json({error: "Se ha producido un error al eliminar la canción."})
                    });
                }
            });

        } catch (e) {
            res.status(500);
            res.json({error: "Se ha producido un error, revise que el ID sea válido."})
        }
    });
    app.post('/api/v1.0/songs', songValidatorInsert, function (req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(422);
                res.json({errors: errors.array()})
            } else {
                let song = {title: req.body.title, kind: req.body.kind, price: req.body.price, author: req.session.user}
                songsRepository.insertSong(song, function (songId) {
                    if (songId === null) {
                        res.status(409);
                        res.json({error: "No se ha podido crear la canción. El recurso ya existe."});
                    } else {
                        res.status(201);
                        res.json({message: "Canción añadida correctamente.", _id: songId})
                    }
                });
            }
        } catch (e) {
            res.status(500);
            res.json({error: "Se ha producido un error al intentar crear la canción: " + e})
        }
    });
    app.put('/api/v1.0/songs/:id', songValidatorUpdate, function (req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(422);
                res.json({errors: errors.array()})
            } else {
                let songId = ObjectId(req.params.id);
                let filter = {_id: songId};
                //Si la _id NO no existe, no crea un nuevo documento.
                const options = {upsert: false};
                let song = {author: req.session.user}
                if (typeof req.body.title !== "undefined" && req.body.title !== null) song.title = req.body.title;
                if (typeof req.body.kind !== "undefined" && req.body.kind !== null) song.kind = req.body.kind;
                if (typeof req.body.price !== "undefined" && req.body.price !== null) song.price = req.body.price;
                songsRepository.updateSong(song, filter, options).then(result => {
                    if (result === null) {
                        res.status(404);
                        res.json({error: "ID inválido o no existe, no se ha actualizado la canción."});
                    } //La _id No existe o los datos enviados no difieren de los ya almacenados.
                    else if (result.modifiedCount == 0) {
                        res.status(409);
                        res.json({error: "No se ha modificado ninguna canción."});
                    } else {
                        res.status(200);
                        res.json({message: "Canción modificada correctamente.", result: result})
                    }
                }).catch(error => {
                    res.status(500);
                    res.json({error: "Se ha producido un error al modificar la canción."})
                });
            }
        } catch (e) {
            res.status(500);
            res.json({error: "Se ha producido un error al intentar modificar la canción: " + e})
        }
    });
    app.post('/api/v1.0/users/login', function (req, res) {
        try {
            let securePassword = app.get("crypto").createHmac('sha256', app.get('clave'))
                .update(req.body.password).digest('hex');
            let filter = {
                email: req.body.email,
                password: securePassword
            }
            let options = {};
            usersRepository.findUser(filter, options).then(user => {
                if (user == null) {
                    res.status(401);
                    res.json({
                        message: "usuario no autorizado",
                        authenticated: false
                    })
                } else {
                    let token = app.get('jwt').sign({user: user.email, time: Date.now() / 1000}, "secreto");
                    res.status(200);
                    res.json({
                        message: "usuario autorizado",
                        authenticated: true,
                        token: token
                    })
                }
            }).catch(error => {
                res.status(401);
                res.json({
                    message: "Se ha producido un error al verificar credenciales",
                    authenticated: false
                })
            })
        } catch (e) {
            res.status(500);
            res.json({
                message: "Se ha producido un error al verificar credenciales",
                authenticated: false
            })
        }
    });

    function validateInsertSong(song, callbackFunction) {
        let errors = new Array();
        if (song.title === null || typeof song === 'undefined' || song.title.trim().length == 0) {
            errors.push({
                "value": song.title,
                "msg": "El título de la canción no puede estar vacío",
                "param": "title",
                "location": "body"
            });
        }
        if (song.kind === null || typeof song === 'undefined' || song.kind.trim().length == 0) {
            errors.push({
                "value": song.kind,
                "msg": "El género de la canción no puede estar vacío",
                "param": "kind",
                "location": "body"
            });
        }
        if (song.price === null || typeof song === 'undefined' || song.price.toString().trim().length == 0) {
            errors.push({
                "value": song.price,
                "msg": "El precio de la canción no puede estar vacío",
                "param": "price",
                "location": "body"
            });
        }
        if (song.price < 0) {
            errors.push({
                "value": song.price,
                "msg": "El precio de la canción no puede ser negativo",
                "param": "price",
                "location": "body"
            });
        }
        if (errors === null || errors.length > 0) {
            callbackFunction(errors);
        } else {
            callbackFunction(null);
        }
    }

    function validateUser(author, user, callback) {
        let errors = new Array()
        if (author._id !== user._id) {
            errors.push({
                "value": author,
                "msg": "No puede borrar una canción que no es suya",
                "param": "author",
                "location": "body"
            })
        }
        if (errors === null || errors.length > 0) {
            callback(errors);
        } else {
            callback(null);
        }
    }

    function validateRemoveSong(songId, callback) {
        let errors = new Array()
        if (author._id !== user._id) {
            errors.push({
                "value": author,
                "msg": "No puede borrar una canción que no es suya",
                "param": "author",
                "location": "body"
            })
        }
        if (errors === null || errors.length > 0) {
            callback(errors);
        } else {
            callback(null);
        }
    }
}
