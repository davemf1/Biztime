/** @format */

const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const slugify = require("slugify");
const db = require("../db");

// GET /industries
// Returns list of industries, like {industries: [{code, industry}, ...]}
router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(`SELECT * FROM industries`);
    return res.json({ industries: results.rows });
  } catch (e) {
    return next(e);
  }
});

// POST /industries
// Adds a industry.
// Needs to be given JSON like: {code, industry}
// Returns obj of new industry: {industry: {code, industry}}
router.post("/", async (req, res, next) => {
  try {
    const { code, industry } = req.body;
    const newCode = slugify(String(req.body.code), {
      remove: /[*+~.()'"!:@]/g,
      lower: true,
    });
    const results = await db.query(
      "INSERT INTO industries (code, industry) VALUES ($1, $2) RETURNING code, industry",
      [newCode, industry]
    );
    return res.status(201).json({ industry: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

// POST /industries/:comp_code
// Associates an industry with a company
// Needs to be given JSON like: {ind_code}
// Returns obj of new industry/company relation: {companies_industries: {comp_code, ind_code}}
router.post("/:comp_code", async (req, res, next) => {
  try {
    const { ind_code } = req.body;
    const { comp_code } = req.params;
    const results = await db.query(
      "INSERT INTO companies_industries (comp_code, ind_code) VALUES ($1, $2) RETURNING comp_code, ind_code",
      [comp_code, ind_code]
    );
    return res.status(201).json({ companies_industries: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;