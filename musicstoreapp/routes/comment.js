const {ObjectId} = require("mongodb");
module.exports = function (app, commentsRepository) {
    app.post('/comments/:id', function (req, res) {
        let comment = {
            user: req.session.user,
            textComment: req.body.textComment
        }
        let idSong = req.params.id;
        if(comment.textComment == undefined){
            res.send("Error leyendo el campo de texto");
        }
        else if (comment.textComment.trim() == "") {
            res.send("No se puede añadir un comentario vacío");
        } else {
            commentsRepository.insertComment(comment, function (songId) {
                if (songId == null) {
                    res.send("Error al agregar comentario")
                } else {
                    res.redirect("/songs/" + idSong);
                }
            });
        }
    });
}