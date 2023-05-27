jwt = require("jsonwebtoken");
const pool = require("../database");

class CartController {
  getCart(req, res) {
    const username = req.username;
    pool.getConnection(function (err, connection) {
      if (err) throw err;
      pool.query(
        "SELECT * FROM cart WHERE username = ?",
        [username],
        (err, rows, fields) => {
          if (err) throw err;
          if (rows.length === 0) return res.json({ cart: [], success: false });

          res.status(200).json({ success: true, cart: rows });
        }
      );
      connection.release();
    });
  }

  createCart(req, res) {
    const username = req.username;
    const newCart = req.body;

    pool.getConnection(function (err, connection) {
      if (err) throw err;
      connection.query(
        `INSERT INTO cart (productId, username, color, size, quality, price) VALUES (${JSON.stringify(
          newCart.productId
        )}, ${JSON.stringify(username)}, ${JSON.stringify(
          newCart.color
        )}, ${JSON.stringify(newCart.size)}, ${newCart.quality}, ${
          newCart.price
        })`,
        (err, rows) => {
          if (err) {
            res.status(401).json({ success: false });
            throw err;
          }
          res.status(200).json({ success: true });
        }
      );
      connection.release();
    });
  }

  updateCart(req, res) {
    const cartId = req.params.id;
    const newCart = req.body;

    pool.getConnection(function (err, connection) {
      if (err) throw err;
      connection.query(
        `SELECT * FROM cart WHERE id = ${cartId}`,
        (err, rows) => {
          if (err) throw err;
          if (rows.length === 0) {
            res.status(401).json({ success: false });
          }

          if (newCart.decrease && rows[0].quality > 1) {
            connection.query(
              `UPDATE cart SET quality = ${
                rows[0].quality - 1
              } WHERE id = ${cartId}`,
              (err, rows) => {
                if (err) throw err;

                res.status(200).json({ success: true });
              }
            );
          }

          if (newCart.increase) {
            connection.query(
              `UPDATE cart SET quality = ${
                rows[0].quality + 1
              } WHERE id = ${cartId}`,
              (err, rows) => {
                if (err) throw err;

                res.status(200).json({ success: true });
              }
            );
          }
        }
      );
      connection.release();
    });
  }

  deleteCartById(req, res) {
    const id = req.params.id;
    pool.getConnection(function (err, connection) {
      connection.query(`DELETE FROM cart WHERE id = ?`, id, (err, rows) => {
        if (err) throw err;

        res.status(200).json({ success: true });
      });
      connection.release();
    });
  }
}

module.exports = new CartController();
