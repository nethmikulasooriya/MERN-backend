import Order from "../models/order.js";
import Product from "../models/product.js";

export async function createOrder(req, res) {
  if (req.user == null) {
    return res.status(403).json({
      message: "Please login and try again"
    });
  }

  const orderInfo = req.body;

  if (orderInfo.name == null) {
    orderInfo.name = req.user.firstName + " " + req.user.lastName;
  }

  if (orderInfo.address == null) {
    orderInfo.address = req.user.address;
  }

  try {
    // Generate order ID
    let orderId = "CBC00001";
    const lastOrder = await Order.find().sort({ date: -1 }).limit(1);

    if (lastOrder.length > 0) {
      const lastOrderId = lastOrder[0].orderId;
      const lastOrderNumberString = lastOrderId.replace("CBC", "");
      const lastOrderNumber = parseInt(lastOrderNumberString);
      const newOrderNumber = lastOrderNumber + 1;
      const newOrderNumberString = String(newOrderNumber).padStart(5, "0");
      orderId = "CBC" + newOrderNumberString;
    }

    let total = 0;
    let labelledTotal = 0;
    const products = [];

    // Process products from the database
    for (let i = 0; i < orderInfo.products.length; i++) {
      const item = await Product.findOne({
        productId: orderInfo.products[i].productId
      });

      if (item == null) {
        return res.status(404).json({
          message:
            "Product with productId " +
            orderInfo.products[i].productId +
            " not found"
        });
      }

      if (item.isAvailable === false) {
        return res.status(404).json({
          message:
            "Product with productId " +
            orderInfo.products[i].productId +
            " is not available right now"
        });
      }

      if (item.isDeleted === true) {
        return res.status(404).json({
          message:
            "Product with productId " +
            orderInfo.products[i].productId +
            " is not available"
        });
      }

      products[i] = {
        productInfo: {
          productId: item.productId,
          name: item.name,
          altNames: item.altNames,
          description: item.description,
          images: item.images,
          labelledPrice: item.labelledPrice,
          price: item.price
        },
        quantity: orderInfo.products[i].quantity
      };

      total += item.price * orderInfo.products[i].quantity;
      labelledTotal += (item.labelledPrice || item.price) * orderInfo.products[i].quantity;
    }

    // Construct the Order document
    const order = new Order({
      orderId: orderId,
      name: orderInfo.name,
      email: req.user.email,
      address: orderInfo.address,
      phone: orderInfo.phone,
      total: total,
      labelledTotal: labelledTotal,
      products: products
    });

    const createdOrder = await order.save();

    return res.status(201).json({
      message: "Order created successfully",
      order: createdOrder
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to create order",
      error: err.message || err
    });
  }
}