const Book = require("../models/Book");
const fs = require("fs");

exports.createBook = (req, res, next) => {
  const bookObject = JSON.parse(req.body.book);
  delete bookObject._id;
  const book = new Book({
    ...bookObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get("host")}/images/resized_${
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
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        res.status(401).json({ message: "Non autorise" });
      } else {
        const filename = book.imageUrl.split("/images/")[1];
        fs.unlink(`images/${filename}`, () => {
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
  const grade = req.body.rating;
  const paramId = req.params.id;
  const userId = req.auth.userId;

  console.log(paramId);

  Book.findOne({ _id: paramId }).then((book) => {
    if (!book) {
      return res.status(404).json({ message: "Livre non trouve" });
    }

    const hasRated = book.ratings.some(
      (rating) => rating.userId.toString() === userId
    );

    const isBookCreator = book.userId.toString() === userId;

    if (hasRated && isBookCreator) {
      return res.status(400).json({
        message:
          "Vous ne pouvez pas noter votre propre livre une deuxieme fois",
      });
    }

    const newRatings = [...book.ratings, { userId, grade }];

    const totalGrades = newRatings.reduce(
      (total, rating) =>
        total + (Number.isFinite(rating.grade) ? rating.grade : 0),
      0
    );

    let averageRating =
      Number.isFinite(totalGrades) && newRatings.length > 0
        ? totalGrades / newRatings.length
        : 0;

    averageRating = parseFloat(averageRating.toFixed(1));

    book.ratings = newRatings;
    book.averageRating = averageRating;

    book
      .save()
      .then(() => {
        return res.status(200).json(book);
      })
      .catch((error) => {
        console.error(error);
        return res.status(500).json({ error });
      });
  });
};

exports.bestRatings = (req, res, next) => {
  Book.find()
    .sort({ averageRating: -1 })
    .limit(3)
    .then((books) => {
      res.status(200).json(books);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ error });
    });
};
