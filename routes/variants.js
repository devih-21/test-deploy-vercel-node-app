const express = require("express");
const router = express.Router();
const VariantController = require("../app/controllers/variantController");
const verifyToken = require("../middleware/auth");

router.get("/getAllVariant", VariantController.getAllVariant);
router.get("/getOneVariant/:id", VariantController.getOneVariant);

module.exports = router;
