const fs = require('fs');
const Sauce = require('../models/Sauce');

exports.createSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce);
  const sauce = new Sauce({
    ...sauceObject,
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
    likes: 0,
    dislikes: 0,
    usersLiked: [],
    usersDisliked: []
  });
  sauce.save()
    .then(() => res.status(201).json({ message: 'Objet enregistré !'}))
    .catch(error => {
      console.log(error);
      res.status(400).json({ error })
    } );
};

exports.modifySauce = (req, res, next) => {
  const sauceObject = req.file ?
    {
      ...JSON.parse(req.body.sauce),
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body };
  Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
    .then(() => res.status(200).json({ message: 'Objet modifié !'}))
    .catch(error => res.status(400).json({ error }));
};

exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then(sauce => {
      const filename = sauce.imageUrl.split('/images/')[1];
      fs.unlink(`images/${filename}`, () => {
        Sauce.deleteOne({ _id: req.params.id })
          .then(() => res.status(200).json({ message: 'Objet supprimé !'}))
          .catch(error => res.status(400).json({ error }));
      });
    })
    .catch(error => res.status(500).json({ error }));
};

exports.GetOneSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
      .then(sauce => res.status(200).json(sauce))
      .catch(error => res.status(404).json({ error }));
};

exports.GetAllSauce = (req, res, next) => {
    Sauce.find()
    .then(sauces => res.status(200).json(sauces))
    .catch(error => res.status(400).json({ error }));
};

exports.likeSauce = ( req, res, next ) => {
    if (req.body.like === 1 ) {
      Sauce.updateOne({ _id: req.params.id }, {$inc : {likes: +1} , $push: { usersLiked: req.body.userId}})
      .then(() => {res.status(200).json({ message: 'Objet modifié !'})} )
    .catch(error => {
      console.log(error);
      res.status(400).json({ error })
    } );
    } 
    //si negatif, update dislikes, ajout userId dans usersDisliked
    else if (req.body.like === -1 ) {
      Sauce.updateOne({ _id: req.params.id }, {$inc : {dislikes: +1} , $push: { usersDisliked: req.body.userId}})
      .then(() => {res.status(200).json({ message: 'Objet modifié !'})} )
      .catch(error => res.status(400).json({ error }));
    }
    //si zéro, chercher si c'est like ou dislike
    else if (req.body.like === 0 ) {
       Sauce.findOne({_id: req.params.id})
       .then((result) => {
        if (result.usersLiked.includes(req.body.userId)) { //si like
            Sauce.updateOne({_id: req.params.id}, {$pull: {usersLiked: req.body.userId}, $inc : {likes: -1} })
            .then(() => res.status(200).json({message: 'retrait du like'}))
            .catch((error) => res.status(400).json({error}));
        }
        if (result.usersDisliked.includes(req.body.userId)) { //si dislike
          Sauce.updateOne({_id: req.params.id}, {$pull: {usersDisliked: req.body.userId}, $inc : {dislikes: -1} })
          .then(() => res.status(200).json({message: 'retrait du dislike'}))
          .catch((error) => res.status(400).json({error}));
      }
    }).catch((error) => res.status(404).json({error}));
  }
};

