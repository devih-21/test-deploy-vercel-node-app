jwt = require("jsonwebtoken");
const pool = require("../database");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const Readable = require("stream").Readable;

class ProductController {
  postImage(req, res) {
    const data = req.body;
    res.json(data);
  }

  getAllProduct(req, res) {
    pool.getConnection(function (err, connection) {
      if (err) throw err;
      connection.query("SELECT * FROM  product", (err, rows, fields) => {
        if (err) throw err;
        if (rows.length === 0)
          return res.json({ success: false, products: [] });
        res.status(200).json({
          success: true,
          products: rows,
        });
      });
      connection.release();
    });
  }

  getBestSeller(req, res) {
    const params = req.params;
    pool.getConnection(function (err, connection) {
      if (err) throw err;
      connection.query(
        "SELECT * FROM  product",
        [params.params],
        (err, rows, fields) => {
          if (err) throw err;
          if (rows.length === 0)
            return res.json({ success: false, products: [] });
          res.status(200).json({
            success: true,
            products: rows.map((row) => {
              return {
                ...row,
                image: {
                  name: row.image,
                  thumbUrl: fs.readFileSync(
                    `./client/src/assets/images/${row.image}`,
                    {
                      encoding: "base64",
                    }
                  ),
                },
              };
            }),
          });
        }
      );
      connection.release();
    });
  }

  getProductByCategory(req, res) {
    const params = req.params;
    pool.getConnection(function (err, connection) {
      if (err) throw err;
      connection.query(
        "SELECT * FROM  product WHERE category = ?",
        [params.params],
        (err, rows, fields) => {
          if (err) throw err;
          if (rows.length === 0)
            return res.json({ success: false, products: [] });
          res.status(200).json({
            success: true,
            products: rows.map((row) => {
              return {
                ...row,
                image: {
                  name: row.image,
                  thumbUrl: fs.readFileSync(
                    `./client/src/assets/images/${row.image}`,
                    {
                      encoding: "base64",
                    }
                  ),
                },
              };
            }),
          });
        }
      );
      connection.release();
    });
  }

  getOneProduct(req, res) {
    const id = req.params.id;

    pool.getConnection(function (err, connection) {
      if (err) throw err;
      connection.query(
        "SELECT * FROM product inner join images on product.productId = images.productId and product.productId = ?",
        [id],
        (err, rows, fields) => {
          if (err) throw err;
          if (rows.length === 0)
            return res.status(401).json({ success: false });
          const productWithImagin = {
            productId: rows[0].productId,
            title: rows[0].title,
            description: rows[0].description,
            price: rows[0].price,
            category: rows[0].category,
            date: rows[0].date,
            path: rows[0].path,
            imageLinks: rows.map((row) => {
              return {
                name: row.imageLink,
                thumUrl: ""
                // thumbUrl: fs.readFileSync(
                //   `./client/src/assets/images/${row.imageLink}`,
                //   {
                //     encoding: "base64",
                //   }
                // ),
              };
            }),
          };
          res.status(200).json({ success: true, products: productWithImagin });
        }
      );
      connection.release();
    });
  }

  post(req, res) {
    const product = req.body;
    const randomId = uuidv4();

    product.images.map((image) => {
      const base64 = image.thumbUrl.split(",")[1];
      const imgBuffer = Buffer.from(base64, "base64");
      var fileSave = new Readable();

      fileSave.push(imgBuffer);
      fileSave.push(null);

      fileSave.pipe(
        fs.createWriteStream(`./client/src/assets/images/${image.name}`)
      );
    });

    pool.getConnection(function (err, connection) {
      if (err) throw err;
      connection.query(
        "SELECT * FROM product WHERE product.path = ?",
        [product.path],
        (err, results) => {
          if (err) throw err;
          if (results.length != 0) {
            res.json({ success: false, status: "duplicated" });
          } else {
            const imagesLink = product.images.map((image) => [
              randomId,
              image.name,
            ]);
            const variants = [];
            product.color.forEach((col) => {
              product.size.forEach((si) => {
                variants.push([randomId, col, si, product.quality]);
              });
            });

            connection.query(
              `INSERT INTO product (productId, title, description, price, category, date, path, image, quality) VALUES (${JSON.stringify(
                randomId
              )}, ${JSON.stringify(product.title)}, ${JSON.stringify(
                product.description
              )}, ${product.price}, ${JSON.stringify(
                product.category
              )}, ${connection.escape(new Date())}, ${JSON.stringify(
                product.path
              )}, ${JSON.stringify(product.images[0].name)}, ${
                product.quality * product.size.length * product.color.length
              })`,
              (err, rows) => {
                if (err) throw err;
              }
            );
            // create images
            connection.query(
              "INSERT INTO images (productId, imageLink) VALUES ?",
              [imagesLink],
              (err, rows) => {
                if (err) throw err;
              }
            );

            // create variants
            connection.query(
              "INSERT INTO variants (productId, color, size, quality) VALUES ?",
              [variants],
              (err, rows) => {
                if (err) throw err;
              }
            );

            res.status(200).json({ success: true, status: "create success" });
          }
        }
      );
      connection.release();
    });
  }

  put(req, res) {
    const id = req.params.id;
    const product = req.body;

    product.images.map((image) => {
      const base64 = image.thumbUrl.split(",")[1];
      const imgBuffer = Buffer.from(base64, "base64");
      var fileSave = new Readable();

      fileSave.push(imgBuffer);
      fileSave.push(null);

      fileSave.pipe(
        fs.createWriteStream(`./client/src/assets/images/${image.name}`)
      );
    });

    pool.getConnection(function (err, connection) {
      if (err) throw err;

      const newQuality = product.variants.reduce((a, b) => a + b.quality, 0);
      connection.query(
        "UPDATE product SET title = ?, description = ?, price = ?, category = ?, image = ?, quality = ? WHERE productId = ?",
        [
          product.title,
          product.description,
          product.price,
          product.category,
          product.images[0].name,
          newQuality,
          id,
        ],
        (err, rows) => {
          if (err) throw err;
        }
      );

      connection.query(
        `DELETE FROM images WHERE productId = ?`,
        id,
        (err, rows) => {
          if (err) throw err;

          const imagesLink = product.images.map((image) => [id, image.name]);
          connection.query(
            "INSERT INTO images (productId, imageLink) VALUES ?",
            [imagesLink],
            (err, rows) => {
              if (err) throw err;
            }
          );
        }
      );

      connection.query(
        `DELETE FROM variants WHERE productId = ?`,
        id,
        (err, rows) => {
          if (err) throw err;

          const newVariants = product.variants.map((variant) => [
            id,
            variant.color,
            variant.size,
            variant.quality,
          ]);
          connection.query(
            "INSERT INTO variants (productId, color, size, quality) VALUES ?",
            [newVariants],
            (err, rows) => {
              if (err) throw err;
            }
          );
        }
      );

      res.status(200).json({ success: true });
      connection.release();
    });
  }

  deleteProductById(req, res) {
    const id = req.params.id;
    pool.getConnection(function (err, connection) {
      connection.query(
        `DELETE FROM product WHERE productId = ?`,
        id,
        (err, rows) => {
          if (err) throw err;

          res.status(200).json({ success: true });
        }
      );
      connection.release();
    });
  }
}

module.exports = new ProductController();
