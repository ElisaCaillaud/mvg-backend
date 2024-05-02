const express = require("express");
const router = express.Router();

const Book = require("../models/Book");

/*AJOUTER UN OBJET VIA FORM*/
router.post("/", (req, res, next) => {
  delete req.body._id;
  const book = new Book({
    ...req.body,
  });
  book
    .save()
    .then(() => res.status(201).json({ message: "Objet enregistré !" }))
    .catch((error) => res.status(400).json({ error }));
});

/*MODIFIER UN OBJET*/
router.put("/:id", (req, res, next) => {
  Book.updateOne({ _id: req.params.id }, { ...req.body, _id: req.params.id })
    .then(() => res.status(200).json({ message: "Objet modifié !" }))
    .catch((error) => res.status(400).json({ error }));
});

/*SUPPRIMER UN OBJET*/
router.delete("/:id", (req, res, next) => {
  Book.deleteOne({ _id: req.params.id })
    .then(() => res.status(200).json({ message: "Objet supprimé !" }))
    .catch((error) => res.status(400).json({ error }));
});

router.get("/:id", (req, res, next) => {
  Book.findOne({ _id: req.params.id }) /*RETROUVER UN OBJET*/
    .then((book) => res.status(200).json(thing))
    .catch((error) => res.status(404).json({ error }));
});

router.get("/", (req, res, next) => {
  Book.find() /*RETROUVER TOUS LES OBJETS*/
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(400).json({ error }));
});

module.exports = router;
