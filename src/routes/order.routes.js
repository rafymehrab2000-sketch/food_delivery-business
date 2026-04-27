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

// GET SINGLE ORDER (TRACKING)
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const orderId = Number(req.params.id);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        restaurant: true,
        orderItems: {
          include: {
            menuItem: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

// UPDATE ORDER STATUS
router.patch("/:id/status", authMiddleware, async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    const { status } = req.body;

    const allowedStatuses = [
      "pending",
      "accepted",
      "preparing",
      "delivering",
      "delivered"
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: "Invalid status value"
      });
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status }
    });

    res.json({
      message: "Order status updated successfully",
      order
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Order status update failed" });
  }
});

// ASSIGN RIDER
router.patch("/:id/assign-rider", authMiddleware, async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    const { assignedRider } = req.body;

    if (!assignedRider) {
      return res.status(400).json({
        error: "assignedRider is required"
      });
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { assignedRider }
    });

    res.json({
      message: "Rider assigned successfully",
      order
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Rider assignment failed" });
  }
});

module.exports = router;