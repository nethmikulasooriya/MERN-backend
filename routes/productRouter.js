import express from 'express';
import { getProduct, saveProduct,deleteProduct,updateProduct, getProductById, searchProducts } from "../controllers/productController.js";
const productRouter = express.Router();

productRouter.get('/', getProduct);
productRouter.post('/', saveProduct);
productRouter.get('/search', searchProducts);
productRouter.delete('/:productId', deleteProduct);
productRouter.put('/:productId', updateProduct);
productRouter.get('/:productId',getProductById)

export default productRouter;