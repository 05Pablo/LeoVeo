const userService = require('../services/userService');
const { collectErrors } = require('../validators');

exports.profile = async (req, res) => {
  const { user, reviews, stats } = await userService.getProfile(req.params.username);
  const isMe = !!req.user && String(req.user._id) === String(user._id);
  res.render('users/profile', { title: `@${user.username}`, profileUser: user, reviews, stats, isMe, errors: {} });
};

exports.me = (req, res) => res.redirect(`/users/${req.user.username}`);

exports.updateBio = async (req, res) => {
  const errors = collectErrors(req);
  if (errors) {
    req.flash('error', errors.bio);
  } else {
    await userService.updateBio(req.user, req.body.bio);
    req.flash('success', 'Perfil actualizado');
  }
  res.redirect(`/users/${req.user.username}`);
};
