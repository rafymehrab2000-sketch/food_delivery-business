const express = require("express");
const prisma = require("../prisma");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

// ADD MENU ITEM
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { restaurantId, name, description, price } = req.body;

    const menuItem = await prisma.menuItem.create({
      data: {
        restaurantId,
        name,
        description,
        price
      }
    });

    res.json({
      message: "Menu item created successfully",
      menuItem
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Menu item creation failed" });
  }
});

// GET MENU BY RESTAURANT
router.get("/:restaurantId", async (req, res) => {
  try {
    const restaurantId = Number(req.params.restaurantId);

    const menuItems = await prisma.menuItem.findMany({
      where: { restaurantId }
    });

    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch menu" });
  }
});

module.exports = router;