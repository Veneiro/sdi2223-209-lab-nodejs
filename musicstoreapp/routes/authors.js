module.exports = function (app) {
    app.get("/authors", function (req, res) {
        let authors = [{
            "name":"Pepe",
            "group":"Group 1",
            "rol":"Cantante",
        }
        ];
        let response = {
            authors:authors
        };
        res.render("authors/authors.twig", response);
    });

    app.post('/authors/add', function (req, res) {
        let response = "Autor agregado: " + req.body.name + "<br>"
        + " Grupo: " + req.body.group + "<br>"
        + " Rol: " + req.body.rol;
        res.send(response);
    });

    app.get('/authors/add', function (req, res) {
        res.render("authors/add.twig");
    });

    app.get('/authors/*', function (req, res) {
        let authors = [{
            "name":"Pepe",
            "group":"Group 1",
            "rol":"Cantante",
        }
        ];
        let response = {
            authors:authors
        };
        res.render("authors/authors.twig", response);
    });
}