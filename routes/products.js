const express = require("express");
const router = express.Router();
const ProductController = require("../app/controllers/productController");
const verifyToken = require("../middleware/auth");

router.get("/getAllProduct", ProductController.getAllProduct);
router.get("/getBestSeller", ProductController.getBestSeller);
router.get("/getOneProduct/:id", ProductController.getOneProduct);
router.get(
  "/getProductByCategory/:params",
  ProductController.getProductByCategory
);  
router.post("/create", verifyToken, ProductController.post);
router.put("/update/:id", verifyToken, ProductController.put);
router.delete("/delete/:id", verifyToken, ProductController.deleteProductById);

router.post("/image", ProductController.postImage);

module.exports = router;
