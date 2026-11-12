import express from "express";
import { createOrder, getOrders, updateOrderStatus } from "../controllers/ordersController.js";
const orderRouter = express.Router();

orderRouter.post("/", createOrder);
orderRouter.get("/:page/:limit", getOrders);
export default orderRouter;
orderRouter.put("/:orderId/:status", updateOrderStatus);
