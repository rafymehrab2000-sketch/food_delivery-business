const express = require("express");
const prisma = require("../prisma");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

// CREATE ORDER
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      restaurantId,
      customerName,
      customerPhone,
      customerAddress,
      items
    } = req.body;

    let subtotal = 0;

    for (const item of items) {
      subtotal += item.price * item.quantity;
    }

    const deliveryFee = 3.5;
    const serviceFee = 0.8;
    const total = subtotal + deliveryFee + serviceFee;

    const order = await prisma.order.create({
      data: {
        customerId: req.user.id,
        restaurantId,
        customerName,
        customerPhone,
        customerAddress,
        subtotal,
        deliveryFee,
        serviceFee,
        total,
        orderItems: {
          create: items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: item.price
          }))
        }
      },
      include: {
        orderItems: true
      }
    });

    res.json({
      message: "Order created successfully",
      order
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Order creation failed" });
  }
});

// GET ALL ORDERS
router.get("/", authMiddleware, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        restaurant: true,
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
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

module.exports = router;