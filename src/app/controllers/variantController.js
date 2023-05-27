jwt = require("jsonwebtoken");
const pool = require("../database");

class VariantController {
  getAllVariant(req, res) {
    pool.getConnection(function (err, connection) {
      if (err) throw err;
      connection.query("SELECT * FROM  variants", (err, rows, fields) => {
        if (err) throw err;
        if (rows.length === 0) return res.status(401).json({ success: false });
        res.status(200).json({
          success: true,
          variants: rows,
        });
      });
      connection.release();
    });
  }

  getOneVariant(req, res) {
    const id = req.params.id;

    pool.getConnection(function (err, connection) {
      if (err) throw err;
      connection.query(
        "SELECT * FROM variants where variants.productId = ?",
        [id],
        (err, rows, fields) => {
          if (err) throw err;
          if (rows.length === 0)
            return res.status(401).json({ success: false });
          res.status(200).json({ success: true, variants: rows });
        }
      );
      connection.release();
    });
  }
}

module.exports = new VariantController();
