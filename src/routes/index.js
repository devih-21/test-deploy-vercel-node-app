const usersRouter = require("./users");
const productRouter = require("./products");
const VariantRouter = require("./variants");
const OrderRouter = require("./order");
const CartRouter = require("./cart");

function route(app) {
  app.use("/", usersRouter);
  app.use("/product", productRouter);
  app.use("/variant", VariantRouter);
  app.use("/order", OrderRouter);
  app.use("/cart", CartRouter);
}

module.exports = route;
