import Product from "../models/product.js";
import { isAdmin } from "./userController.js";

// 1. Get all products (async යොදා ඇත)
export async function getProduct(req, res) {
    try {
        if (isAdmin(req)) {
            const products = await Product.find();
            res.json(products);
        } else {
            const products = await Product.find({ isAvailable: true });
            res.json(products);
        }
    } catch (err) {
        res.status(500).json({
            message: "Failed to get products",
            error: err.message || err,
        });
    }
}

// 2. Save a new product
export function saveProduct(req, res) {
    // Admin නොවේ නම් අවහිර කිරීම
    if (!isAdmin(req)) {
        return res.status(403).json({
            message: "Unauthorized! You need to be an admin",
        });
    }

    const product = new Product(req.body);

    product
        .save()
        .then(() => {
            res.status(201).json({
                message: "Product added successfully",
            });
        })
        .catch((err) => {
            res.status(500).json({
                message: "Failed to add product",
                error: err.message,
            });
        });
    }

        export async function deleteProduct(req, res) {
    if (!isAdmin(req)) {
        res.status(403).json({
            message: "You are not authorized to delete a product"
        });
        return;
    }

    try {
        await Product.deleteOne({ productId: req.params.productId });

        res.json({
            message: "Product deleted successfully"
        });
    } catch (err) {
        res.status(500).json({
            message: "Failed to delete product",
            error: err
        });
    }
}
