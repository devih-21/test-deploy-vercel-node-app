jwt = require("jsonwebtoken");
const pool = require("../database");

class UserController {
  get(req, res) {
    console.log(req.username);

    pool.getConnection(function (err, connection) {
      if (err) throw err;
      connection.query(
        "SELECT * FROM user WHERE username = ?",
        [req.username],
        (err, rows, fields) => {
          if (err) throw err;
          if (rows.length === 0)
            return res.send({ success: false }).status(401);

          res.json({
            success: true,
            username: rows[0].username,
            isAdmin: rows[0].isAdmin,
          });
        }
      );
      connection.release();
    });
  }

  getAllUser(req, res) {
    pool.getConnection(function (err, connection) {
      if (err) throw err;
      connection.query(
        "SELECT * FROM user",
        [req.username],
        (err, rows, fields) => {
          if (err) throw err;
          if (rows.length === 0)
            return res.send({ success: false }).status(401);

          res.status(200).json({
            success: true,
            users: rows,
          });
        }
      );
      connection.release();
    });
  }

  userByUsername(req, res) {
    pool.getConnection(function (err, connection) {
      if (err) throw err;
      connection.query(
        "SELECT * FROM user WHERE username = ?",
        [req.username],
        (err, rows, fields) => {
          if (err) throw err;
          if (rows.length === 0)
            return res.send({ success: false }).status(401);

          res.status(200).json({
            success: true,
            user: rows[0],
          });
        }
      );
      connection.release();
    });
  }

  getUsername(req, res) {
    const username = req.params.id;
    pool.getConnection(function (err, connection) {
      if (err) throw err;
      connection.query(
        "SELECT * FROM user WHERE username = ?",
        [username],
        (err, rows, fields) => {
          if (err) throw err;
          if (rows.length === 0)
            return res.send({ success: false }).status(401);
          res.status(200).json({
            success: true,
            user: rows[0],
          });
        }
      );
      connection.release();
    });
  }

  updateUserByUsername(req, res) {
    const username = req.username;
    const user = req.body;
    pool.getConnection(function (err, connection) {
      if (err) throw err;
      connection.query(
        "UPDATE user SET fullname = ?, phone = ?, address = ?, gender = ?, dateofbirth = ? WHERE username = ?",
        [
          user.fullname,
          user.phone,
          user.address,
          user.gender,
          user.dateofbirth,
          username,
        ],
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

  updateAddressByUsername(req, res) {
    const username = req.username;
    const user = req.body;
    pool.getConnection(function (err, connection) {
      if (err) throw err;
      connection.query(
        "UPDATE user SET fullname = ?, phone = ?, address = ? WHERE username = ?",
        [user.fullname, user.phone, user.address, username],
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

  login(req, res) {
    const username = req.body.username;
    const password = req.body.password;

    pool.getConnection(function (err, connection) {
      if (err) throw err;
      connection.query(
        "SELECT * FROM user WHERE username = ? AND password = ?",
        [username, password],
        (err, rows, fields) => {
          if (err) throw err;
          if (rows.length === 0) {
            return res.json({ success: false });
          }

          const accessToken = jwt.sign(
            { userId: rows[0].id, username: rows[0].username },
            process.env.ACCESS_TOKEN_SECRET
          );

          res.json({
            success: true,
            username: rows[0].username,
            accessToken,
            isAdmin: rows[0].isAdmin,
          });
        }
      );

      connection.release();
    });
  }

  create(req, res) {
    const data = req.body;

    pool.getConnection(function (err, connection) {
      if (err) throw err;
      connection.query(
        "SELECT * FROM user WHERE username = ?",
        [data.email],
        (err, rows, fields) => {
          if (err) throw err;
          if (rows.length > 0) {
            res.json({ success: false });
          } else {
            connection.query(
              `INSERT INTO user (username, password, fullname, phone, isAdmin) VALUES (${JSON.stringify(
                data.email
              )}, ${JSON.stringify(data.password)}, ${JSON.stringify(
                data.fullname
              )}, ${JSON.stringify(data.phone)}, ${0})`,
              (err, rows) => {
                if (err) throw err;

                const accessToken = jwt.sign(
                  { username: data.username },
                  process.env.ACCESS_TOKEN_SECRET
                );

                res.json({
                  success: true,
                  username: data.username,
                  accessToken,
                  isAdmin: 0,
                });
              }
            );
          }
        }
      );

      connection.release();
    });
  }
}

module.exports = new UserController();
