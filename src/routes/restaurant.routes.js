const express = require("express");
const prisma = require("../prisma");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

// CREATE RESTAURANT
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

// GET MY RESTAURANT
// ⚠️ MUST BE BEFORE /:id/orders
router.get("/mine", authMiddleware, async (req, res) => {
  try {
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        ownerId: req.user.id
      },
      include: {
        menuItems: true,
        orders: {
          include: {
            orderItems: {
              include: {
                menuItem: true
              }
            }
          },
          orderBy: {
            createdAt: "desc"
          }
        }
      }
    });

    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    res.json(restaurant);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch your restaurant" });
  }
});

// GET ALL RESTAURANTS
router.get("/", async (req, res) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      include: {
        menuItems: true
      }
    });

    res.json(restaurants);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch restaurants" });
  }
});

// GET ORDERS FOR RESTAURANT
router.get("/:id/orders", authMiddleware, async (req, res) => {
  try {
    const restaurantId = Number(req.params.id);

    const restaurant = await prisma.restaurant.findUnique({
      where: {
        id: restaurantId
      }
    });

    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    if (restaurant.ownerId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Not allowed" });
    }

    const orders = await prisma.order.findMany({
      where: {
        restaurantId
      },
      include: {
        orderItems: {
          include: {
            menuItem: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch restaurant orders" });
  }
});

// UPDATE RESTAURANT
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const restaurantId = Number(req.params.id);
    const { name, address, phone, isOpen } = req.body;

    const restaurant = await prisma.restaurant.findUnique({
      where: {
        id: restaurantId
      }
    });

    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    if (restaurant.ownerId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Not allowed" });
    }

    const updatedRestaurant = await prisma.restaurant.update({
      where: {
        id: restaurantId
      },
      data: {
        name,
        address,
        phone,
        isOpen
      }
    });

    res.json({
      message: "Restaurant updated successfully",
      restaurant: updatedRestaurant
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Restaurant update failed" });
  }
});

module.exports = router;