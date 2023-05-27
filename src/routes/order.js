const express = require("express");
const router = express.Router();
const OrderController = require("../app/controllers/orderController");
const verifyToken = require("../middleware/auth");

router.get("/getAllOrder", verifyToken, OrderController.getAllOrder);
router.get(
  "/getAllOrderByUsername",
  verifyToken,
  OrderController.getAllOrderByUsername
);
router.get("/getOrderById/:id", verifyToken, OrderController.getOrderById);
router.post("/createOrder", verifyToken, OrderController.createOrder);
router.put("/editOrder/:orderId", verifyToken, OrderController.editOrder);
router.delete("/delete/:id", verifyToken, OrderController.deleteOrderById);

router.get("/getOrderQuality", verifyToken, OrderController.getOrderQuality);

// checkout
router.post("/create_payment_url", OrderController.createPaymentUrl);
router.get("/vnpay_return", OrderController.VNPayReturn);
router.get("/vnpay_ipn", OrderController.VNPipn);
router.post("/querydr", OrderController.QueryDr);
router.post("/refund", OrderController.refund);

module.exports = router;
