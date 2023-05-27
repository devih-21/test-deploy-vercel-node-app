const express = require("express");
const router = express.Router();
const CartController = require("../app/controllers/cartController");
const verifyToken = require("../middleware/auth");

router.get("/getCart", verifyToken, CartController.getCart);
router.post("/createCart", verifyToken, CartController.createCart);
router.put("/update/:id", verifyToken, CartController.updateCart);

router.delete("/delete/:id", verifyToken, CartController.deleteCartById);

module.exports = router;
