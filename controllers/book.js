const Book = require("../models/Book");
const fs = require("fs");

exports.createBook = (req, res, next) => {
  const bookObject = JSON.parse(req.body.book);
  delete bookObject._id;
  const book = new Book({
    ...bookObject,
    userId: req.auth.userId, // Ajoutez cette ligne
    imageUrl: `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }`,
  });
  book
    .save()
    .then(() => res.status(201).json({ message: "Objet enregistré !" }))
    .catch((error) => res.status(400).json({ error }));
};

exports.getOneBook = (req, res, next) => {
  Book.findOne({
    _id: req.params.id,
  })
    .then((book) => {
      res.status(200).json(book);
    })
    .catch((error) => {
      res.status(404).json({
        error: error,
      });
    });
};

exports.modifyBook = (req, res, next) => {
  let bookObject;
  if (req.file) {
    bookObject = {
      ...JSON.parse(req.body.book),
      imageUrl: `${req.protocol}://${req.get("host")}/images/${
        req.file.filename
      }`,
    };
  } else {
    bookObject = { ...req.body };
  }
  delete bookObject._id;
  Book.findOne({ _id: req.params.id }).then((book) => {
    if (!book) {
      res.status(404).json({ message: "Livre non trouve" });
    } else if (!book.userId || book.userId.toString() !== req.auth.userId) {
      res.status(401).json({ message: "Non autorise" });
    } else {
      Book.updateOne(
        { _id: req.params.id },
        {
          ...bookObject,
          userId: req.auth.userId,
        }
      )
        .then(() => res.status(200).json({ message: "Objet modifié!" }))
        .catch((error) => res.status(500).json({ error }));
    }
  });
};

exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id }) // Verifiez que l'utilisateur est bien l'auteur du livre qu'il supprime
    .then((book) => {
      if (book.userId != req.auth.userId) {
        res.status(401).json({ message: "Non autorise" });
      } else {
        const filename = book.imageUrl.split("/images/")[1];
        fs.unlink(`images/${filename}`, () => {
          // Supprimez l'image du serveur
          Book.deleteOne({ _id: req.params.id })
            .then(() => {
              res.status(200).json({ message: "Objet supprimé !" });
            })
            .catch((error) => res.status(401).json({ error }));
        });
      }
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};

exports.getAllBook = (req, res, next) => {
  Book.find()
    .then((books) => {
      res.status(200).json(books);
    })
    .catch((error) => {
      res.status(400).json({
        error: error,
      });
    });
};

exports.rateBook = (req, res, next) => {
  const { grade } = req.body;
  const { id } = req.params;
  const userId = req.auth.userId;

  Book.findOne({ _id: id }) // Verifiez que le livre existe
    .then((book) => {
      if (!book) {
        return res.status(404).json({ message: "Livre non trouve" });
      }

      const hasRated = book.ratings.some(
        // Verifiez que l'utilisateur n'a pas deja note le livre
        (rating) => rating.userId.toString() === userId
      );

      // Verifiez si l'utilisateur est celui qui a cree le livre
      const isBookCreator = book.userId.toString() === userId;

      if (hasRated && isBookCreator) {
        return res.status(400).json({
          message:
            "Vous ne pouvez pas noter votre propre livre une deuxieme fois",
        });
      }

      book.ratings.push({ userId, grade }); // Ajoutez la note

      // Calculez la moyenne des notes
      const totalGrades = book.ratings.reduce(
        (total, rating) =>
          total + (Number.isFinite(rating.grade) ? rating.grade : 0),
        0
      );
      book.averageRating =
        Number.isFinite(totalGrades) && book.ratings.length > 0
          ? totalGrades / book.ratings.length
          : 0;

      book
        .save() // Sauvegardez le livre
        .then((book) => {
          return res.status(200).json({
            message: "Livre note avec succes",
            averageRating: book.averageRating,
          }); // Retournez une reponse
        })
        .catch((error) => {
          console.error(error);
          return res.status(500).json({ error });
        });
    });
};
