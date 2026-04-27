const express = require("express");
const prisma = require("../prisma");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, address, phone } = req.body;

    const restaurant = await prisma.restaurant.create({
      data: {
        name,
        address,
        phone,
        ownerId: req.user.id
      }
    });

    res.json({
      message: "Restaurant created successfully",
      restaurant
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Restaurant creation failed" });
  }
});

router.get("/", async (req, res) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      include: {
        menuItems: true
      }
    });

    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch restaurants" });
  }
});

module.exports = router;