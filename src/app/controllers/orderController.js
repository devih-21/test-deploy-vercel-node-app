jwt = require("jsonwebtoken");
const pool = require("../database");
const { v4: uuidv4 } = require("uuid");
let $ = require("jquery");
const request = require("request");
const moment = require("moment");
const config = require("config");

class OrderController {
  getAllOrder(req, res) {
    pool.getConnection(function (err, connection) {
      if (err) throw err;
      connection.query("SELECT * FROM orders", (err, rows) => {
        if (err) throw err;
        if (rows.length === 0) return res.status(401).json({ success: false });

        res.status(200).json({
          success: true,
          orders: rows,
        });
      });
      connection.release();
    });
  }

  getOrderQuality(req, res) {
    pool.getConnection(function (err, connection) {
      if (err) throw err;
      connection.query(
        "SELECT productName, COUNT(*)  from displayorder GROUP BY productName ORDER BY COUNT(*) desc ",
        (err, rows) => {
          if (err) throw err;
          if (rows.length === 0)
            return res.status(401).json({ success: false });

          res.status(200).json({
            success: true,
            orders: rows,
          });
        }
      );
      connection.release();
    });
  }

  getAllOrderByUsername(req, res) {
    pool.getConnection(function (err, connection) {
      if (err) throw err;
      connection.query(
        "SELECT * FROM orders WHERE username = ?",
        [req.username],
        (err, rows) => {
          if (err) throw err;
          if (rows.length === 0)
            return res.json({ success: false, orders: [] });

          res.status(200).json({
            success: true,
            orders: rows,
          });
        }
      );
      connection.release();
    });
  }

  getOrderById(req, res) {
    const id = req.params.id;

    pool.getConnection(function (err, connection) {
      if (err) throw err;
      connection.query(
        "SELECT orders.*, displayorder.*, product.category FROM orders inner join displayorder on orders.orderId = displayorder.orderId inner join product on displayorder.productId = product.productId WHERE displayorder.orderId = ?",
        [id],
        (err, rows, fields) => {
          if (err) throw err;
          if (rows.length === 0)
            return res.status(401).json({ success: false });
          res.status(200).json({ success: true, orders: rows });
        }
      );
      connection.release();
    });
  }

  createOrder(req, res) {
    const user = req.body.user;
    const carts = req.body.cart;
    const totalPrice = req.body.totalPrice;

    const randomOrderId = uuidv4();

    pool.getConnection(function (err, connection) {
      if (err) throw err;
      connection.query(
        `INSERT INTO orders (orderId, username, fullname, address, status, orderDate, totalPrice) VALUES (${JSON.stringify(
          randomOrderId
        )}, ${JSON.stringify(user.username)}, ${JSON.stringify(
          user.fullname
        )}, ${JSON.stringify(user.address)}, "pending" , ${connection.escape(
          new Date()
        )}, ${totalPrice})`,
        (err, rows) => {
          if (err) throw err;

          carts.map((cart) => {
            connection.query(
              `INSERT INTO displayorder (orderId, productId, productName, productImage, productColor, productSize, quality, price) VALUES (${JSON.stringify(
                randomOrderId
              )}, ${JSON.stringify(cart.productId)}, ${JSON.stringify(
                cart.title
              )}, ${JSON.stringify(cart.imagePath)}, ${JSON.stringify(
                cart.color
              )} , ${JSON.stringify(cart.size)}, ${cart.quality}, ${
                cart.price
              })`,
              (err, rows) => {
                if (err) throw err;

                connection.query(
                  `DELETE FROM cart WHERE id = ?`,
                  cart.cartId,
                  (err, rows) => {
                    if (err) throw err;
                  }
                );

                connection.query(
                  "SELECT * FROM variants WHERE productId = ? AND color = ? AND size = ?",
                  [cart.productId, cart.color, cart.size],
                  (err, rows, fields) => {
                    if (err) throw err;
                    if (rows.length === 0)
                      return res.status(401).json({ success: false });

                    if (rows[0].quality >= cart.quality) {
                      connection.query(
                        "UPDATE variants SET quality = ? WHERE id = ?",
                        [rows[0].quality - cart.quality, rows[0].id],
                        (err, rows) => {
                          if (err) throw err;
                        }
                      );
                    } else {
                      connection.query(
                        "UPDATE variants SET quality = ? WHERE id = ?",
                        [rows[0].quality, rows[0].id],
                        (err, rows) => {
                          if (err) throw err;
                        }
                      );
                    }
                  }
                );

                connection.query(
                  "SELECT * FROM product WHERE productId = ?",
                  [cart.productId],
                  (err, rows, fields) => {
                    if (err) throw err;
                    if (rows.length === 0)
                      return res.status(401).json({ success: false });

                    if (rows[0].quality >= cart.quality) {
                      connection.query(
                        "UPDATE product SET quality = ? WHERE productId = ?",
                        [rows[0].quality - cart.quality, cart.productId],
                        (err, rows) => {
                          if (err) throw err;
                        }
                      );
                    } else {
                      connection.query(
                        "UPDATE product SET quality = ? WHERE productId = ?",
                        [rows[0].quality, cart.productId],
                        (err, rows) => {
                          if (err) throw err;
                        }
                      );
                    }
                  }
                );
              }
            );
          });
          res.status(200).json({ success: true });
        }
      );
      connection.release();
    });
  }

  editOrder(req, res) {
    const orderId = req.params.orderId;
    const order = req.body;
    pool.getConnection(function (err, connection) {
      if (err) throw err;

      connection.query(
        "UPDATE orders SET status = ? WHERE orderId = ?",
        [order.status, orderId],
        (err, rows) => {
          if (err) {
            res.json({ success: false });
            throw err;
          }

          res.status(200).json({ success: true });
        }
      );
      connection.release();
    });
  }

  deleteOrderById(req, res) {
    const id = req.params.id;
    pool.getConnection(function (err, connection) {
      if (err) throw err;

      connection.query(
        `DELETE FROM orders WHERE orderId = ?`,
        id,
        (err, rows) => {
          if (err) throw err;

          res.status(200).json({ success: true });
        }
      );
      connection.release();
    });
  }

  // checkout

  createPaymentUrl(req, res) {
    process.env.TZ = "Asia/Ho_Chi_Minh";

    let date = new Date();
    let createDate = moment(date).format("YYYYMMDDHHmmss");

    let ipAddr =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;

    let tmnCode = process.env.vnp_TmnCode;
    let secretKey = process.env.vnp_HashSecret;
    let vnpUrl = process.env.vnp_Url;
    let returnUrl = process.env.vnp_ReturnUrl;
    let orderId = moment(date).format("DDHHmmss");
    let amount = req.body.amount;
    let bankCode = req.body.bankCode;

    let locale = req.body.language;
    if (locale === null || locale === "") {
      locale = "vn";
    }
    let currCode = "VND";
    let vnp_Params = {};
    vnp_Params["vnp_Version"] = "2.1.0";
    vnp_Params["vnp_Command"] = "pay";
    vnp_Params["vnp_TmnCode"] = tmnCode;
    vnp_Params["vnp_Locale"] = locale;
    vnp_Params["vnp_CurrCode"] = currCode;
    vnp_Params["vnp_TxnRef"] = orderId;
    vnp_Params["vnp_OrderInfo"] = "Thanh toan cho ma GD:" + orderId;
    vnp_Params["vnp_OrderType"] = "other";
    vnp_Params["vnp_Amount"] = amount * 100;
    vnp_Params["vnp_ReturnUrl"] = returnUrl;
    vnp_Params["vnp_IpAddr"] = ipAddr;
    vnp_Params["vnp_CreateDate"] = createDate;
    if (bankCode !== null && bankCode !== "") {
      vnp_Params["vnp_BankCode"] = bankCode;
    }

    vnp_Params = sortObject(vnp_Params);

    let querystring = require("qs");
    let signData = querystring.stringify(vnp_Params, { encode: false });
    let crypto = require("crypto");
    let hmac = crypto.createHmac("sha512", secretKey);
    let signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");
    vnp_Params["vnp_SecureHash"] = signed;
    vnpUrl += "?" + querystring.stringify(vnp_Params, { encode: false });

    res.json({ vnpUrl });
  }

  VNPayReturn(req, res) {
    let vnp_Params = req.query;

    let secureHash = vnp_Params["vnp_SecureHash"];

    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    vnp_Params = sortObject(vnp_Params);

    let tmnCode = process.env.vnp_TmnCode;
    let secretKey = process.env.vnp_HashSecret;

    let querystring = require("qs");
    let signData = querystring.stringify(vnp_Params, { encode: false });
    let crypto = require("crypto");
    let hmac = crypto.createHmac("sha512", secretKey);
    let signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");

    if (secureHash === signed) {
      //Kiem tra xem du lieu trong db co hop le hay khong va thong bao ket qua

      res.json({ success: true, code: vnp_Params["vnp_ResponseCode"] });
    } else {
      res.json({ success: false, code: "97" });
    }
  }

  VNPipn(req, res) {
    let vnp_Params = req.query;
    let secureHash = vnp_Params["vnp_SecureHash"];

    let orderId = vnp_Params["vnp_TxnRef"];
    let rspCode = vnp_Params["vnp_ResponseCode"];

    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    vnp_Params = sortObject(vnp_Params);
    let secretKey = process.env.vnp_HashSecret;
    let querystring = require("qs");
    let signData = querystring.stringify(vnp_Params, { encode: false });
    let crypto = require("crypto");
    let hmac = crypto.createHmac("sha512", secretKey);
    let signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");

    let paymentStatus = "0"; // Giả sử '0' là trạng thái khởi tạo giao dịch, chưa có IPN. Trạng thái này được lưu khi yêu cầu thanh toán chuyển hướng sang Cổng thanh toán VNPAY tại đầu khởi tạo đơn hàng.
    //let paymentStatus = '1'; // Giả sử '1' là trạng thái thành công bạn cập nhật sau IPN được gọi và trả kết quả về nó
    //let paymentStatus = '2'; // Giả sử '2' là trạng thái thất bại bạn cập nhật sau IPN được gọi và trả kết quả về nó

    let checkOrderId = true; // Mã đơn hàng "giá trị của vnp_TxnRef" VNPAY phản hồi tồn tại trong CSDL của bạn
    let checkAmount = true; // Kiểm tra số tiền "giá trị của vnp_Amout/100" trùng khớp với số tiền của đơn hàng trong CSDL của bạn
    if (secureHash === signed) {
      //kiểm tra checksum
      if (checkOrderId) {
        if (checkAmount) {
          if (paymentStatus == "0") {
            //kiểm tra tình trạng giao dịch trước khi cập nhật tình trạng thanh toán
            if (rspCode == "00") {
              //thanh cong
              //paymentStatus = '1'
              // Ở đây cập nhật trạng thái giao dịch thanh toán thành công vào CSDL của bạn
              res.status(200).json({ RspCode: "00", Message: "Success" });
            } else {
              //that bai
              //paymentStatus = '2'
              // Ở đây cập nhật trạng thái giao dịch thanh toán thất bại vào CSDL của bạn
              res.status(200).json({ RspCode: "00", Message: "Success" });
            }
          } else {
            res.status(200).json({
              RspCode: "02",
              Message: "This order has been updated to the payment status",
            });
          }
        } else {
          res.status(200).json({ RspCode: "04", Message: "Amount invalid" });
        }
      } else {
        res.status(200).json({ RspCode: "01", Message: "Order not found" });
      }
    } else {
      res.status(200).json({ RspCode: "97", Message: "Checksum failed" });
    }
  }

  QueryDr(req, res) {
    process.env.TZ = "Asia/Ho_Chi_Minh";
    let date = new Date();

    let crypto = require("crypto");

    let vnp_TmnCode = process.env.vnp_TmnCode;
    let secretKey = process.env.vnp_HashSecret;
    let vnp_Api = process.env.vnp_Api;

    let vnp_TxnRef = req.body.orderId;
    let vnp_TransactionDate = req.body.transDate;

    let vnp_RequestId = moment(date).format("HHmmss");
    let vnp_Version = "2.1.0";
    let vnp_Command = "querydr";
    let vnp_OrderInfo = "Truy van GD ma:" + vnp_TxnRef;

    let vnp_IpAddr =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;

    let currCode = "VND";
    let vnp_CreateDate = moment(date).format("YYYYMMDDHHmmss");

    let data =
      vnp_RequestId +
      "|" +
      vnp_Version +
      "|" +
      vnp_Command +
      "|" +
      vnp_TmnCode +
      "|" +
      vnp_TxnRef +
      "|" +
      vnp_TransactionDate +
      "|" +
      vnp_CreateDate +
      "|" +
      vnp_IpAddr +
      "|" +
      vnp_OrderInfo;

    let hmac = crypto.createHmac("sha512", secretKey);
    let vnp_SecureHash = hmac.update(new Buffer(data, "utf-8")).digest("hex");

    let dataObj = {
      vnp_RequestId: vnp_RequestId,
      vnp_Version: vnp_Version,
      vnp_Command: vnp_Command,
      vnp_TmnCode: vnp_TmnCode,
      vnp_TxnRef: vnp_TxnRef,
      vnp_OrderInfo: vnp_OrderInfo,
      vnp_TransactionDate: vnp_TransactionDate,
      vnp_CreateDate: vnp_CreateDate,
      vnp_IpAddr: vnp_IpAddr,
      vnp_SecureHash: vnp_SecureHash,
    };
    // /merchant_webapi/api/transaction
    request(
      {
        url: vnp_Api,
        method: "POST",
        json: true,
        body: dataObj,
      },
      function (error, response, body) {
        console.log(response);
      }
    );
  }

  refund(req, res) {
    process.env.TZ = "Asia/Ho_Chi_Minh";
    let date = new Date();

    let crypto = require("crypto");

    let vnp_TmnCode = process.env.vnp_TmnCode;
    let secretKey = process.env.vnp_HashSecret;
    let vnp_Api = process.env.vnp_Api;

    let vnp_TxnRef = req.body.orderId;
    let vnp_TransactionDate = req.body.transDate;
    let vnp_Amount = req.body.amount * 100;
    let vnp_TransactionType = req.body.transType;
    let vnp_CreateBy = req.body.user;

    let currCode = "VND";

    let vnp_RequestId = moment(date).format("HHmmss");
    let vnp_Version = "2.1.0";
    let vnp_Command = "refund";
    let vnp_OrderInfo = "Hoan tien GD ma:" + vnp_TxnRef;

    let vnp_IpAddr =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;

    let vnp_CreateDate = moment(date).format("YYYYMMDDHHmmss");

    let vnp_TransactionNo = "0";

    let data =
      vnp_RequestId +
      "|" +
      vnp_Version +
      "|" +
      vnp_Command +
      "|" +
      vnp_TmnCode +
      "|" +
      vnp_TransactionType +
      "|" +
      vnp_TxnRef +
      "|" +
      vnp_Amount +
      "|" +
      vnp_TransactionNo +
      "|" +
      vnp_TransactionDate +
      "|" +
      vnp_CreateBy +
      "|" +
      vnp_CreateDate +
      "|" +
      vnp_IpAddr +
      "|" +
      vnp_OrderInfo;
    let hmac = crypto.createHmac("sha512", secretKey);
    let vnp_SecureHash = hmac.update(new Buffer(data, "utf-8")).digest("hex");

    let dataObj = {
      vnp_RequestId: vnp_RequestId,
      vnp_Version: vnp_Version,
      vnp_Command: vnp_Command,
      vnp_TmnCode: vnp_TmnCode,
      vnp_TransactionType: vnp_TransactionType,
      vnp_TxnRef: vnp_TxnRef,
      vnp_Amount: vnp_Amount,
      vnp_TransactionNo: vnp_TransactionNo,
      vnp_CreateBy: vnp_CreateBy,
      vnp_OrderInfo: vnp_OrderInfo,
      vnp_TransactionDate: vnp_TransactionDate,
      vnp_CreateDate: vnp_CreateDate,
      vnp_IpAddr: vnp_IpAddr,
      vnp_SecureHash: vnp_SecureHash,
    };

    request(
      {
        url: vnp_Api,
        method: "POST",
        json: true,
        body: dataObj,
      },
      function (error, response, body) {
        console.log(response);
      }
    );
  }
}

function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}

module.exports = new OrderController();
