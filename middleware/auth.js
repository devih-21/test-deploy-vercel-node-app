const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.header("Authorization");
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) res.status(400).json({ success: false, status: "noo cooike" });

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.username = decoded.username;

    next();
  } catch (error) {
    console.log(error);
    res.status(400).json({ success: false, status: "cookie not avaiable" });
  }
};

module.exports = verifyToken;
