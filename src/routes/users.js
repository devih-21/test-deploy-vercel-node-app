const express = require("express");
const router = express.Router();
const UserController = require("../app/controllers/userController");
const verifyToken = require("../middleware/auth");

router.get("/auth", verifyToken, UserController.get);
router.get("/getAllUser", verifyToken, UserController.getAllUser);
router.get("/userByUsername", verifyToken, UserController.userByUsername);
router.get("/getUsername/:id", verifyToken, UserController.getUsername);

router.put(
  "/updateUserByUsername",
  verifyToken,
  UserController.updateUserByUsername
);

router.put(
  "/updateAddressByUsername",
  verifyToken,
  UserController.updateAddressByUsername
);

router.post("/login", UserController.login);
router.post("/create", UserController.create);

module.exports = router;
