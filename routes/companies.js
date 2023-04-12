/** @format */

const express = require("express");
const ExpressError = require("../expressError");
const slugify = require("slugify");
const router = express.Router();
const db = require("../db");

// GET /companies
// Returns list of companies, like {companies: [{code, name}, ...]}
router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(`SELECT * FROM companies`);
    return res.json({ companies: results.rows });
  } catch (e) {
    return next(e);
  }
});

// GET /companies/[code]
// Return obj of company:
//     {company: {code, name, description, invoices: [id, ...], industries: [industry, ...]}}
// If the company given cannot be found, this should return a 404 status response.
router.get("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const compResults = await db.query(
      "SELECT * FROM companies WHERE code = $1",
      [code]
    );
    if (compResults.rows.length === 0) {
      throw new ExpressError(`Can't find user with code of ${code}`, 404);
    }
    const invResults = await db.query(
      "SELECT id FROM invoices WHERE comp_code = $1",
      [code]
    );
    const indResults = await db.query(
      `
      SELECT i.industry
        FROM industries AS i
          LEFT JOIN companies_industries AS ci 
            ON i.code = ci.ind_code
          LEFT JOIN companies AS c
           ON c.code = ci.comp_code
        WHERE c.code = $1;`,
      [code]
    );
    const company = compResults.rows[0];

    const invoices = invResults.rows;
    const industries = indResults.rows;
    company.invoices = invoices.map((inv) => inv.id);
    company.industries = industries.map((ind) => ind.industry);

    return res.send({ company: company });
  } catch (e) {
    return next(e);
  }
});

// POST /companies
// Adds a company.
// Needs to be given JSON like: {code, name, description}
// Returns obj of new company: {company: {code, name, description}}
router.post("/", async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const code = slugify(String(req.body.code), {
      remove: /[*+~.()'"!:@]/g,
      lower: true,
    });
    const results = await db.query(
      "INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description",
      [code, name, description]
    );
    return res.status(201).json({ company: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

// PATCH /companies/[code]
// Edit existing company.
// Should return 404 if company cannot be found.
// Needs to be given JSON like: {name, description}
// Returns update company object: {company: {code, name, description}}
router.patch("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const { name, description } = req.body;
    const results = await db.query(
      "UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description",
      [name, description, code]
    );
    if (results.rows.length === 0) {
      throw new ExpressError(`Can't update company with code of ${code}`, 404);
    }
    return res.send({ company: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

// DELETE /companies/[code]
// Deletes company.
// Should return 404 if company cannot be found.
// Returns {status: "deleted"}
router.delete("/:code", async (req, res, next) => {
  try {
    const results = db.query("DELETE FROM companies WHERE code = $1", [
      req.params.code,
    ]);
    return res.send({ msg: "DELETED!" });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;