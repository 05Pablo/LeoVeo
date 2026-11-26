const userService = require('../../services/userService');

exports.profile = async (req, res) => {
  const { user, reviews, stats } = await userService.getProfile(req.params.username);
  // Perfil público: no se expone el email
  res.json({
    user: { _id: user._id, username: user.username, bio: user.bio, role: user.role, createdAt: user.createdAt },
    stats,
    reviews,
  });
};

exports.list = async (req, res) => {
  res.json({ items: await userService.listUsers() });
};

exports.setRole = async (req, res) => {
  const user = await userService.setRole(req.params.id, String(req.body.role), req.user);
  res.json({ user });
};
