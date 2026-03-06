import { Router } from 'express';
import MarketplaceController from '../controllers/marketplace.controller';

const router = Router();

router.get('/comercios', MarketplaceController.listComercios);
router.get('/comercios/:slug', MarketplaceController.getComercioBySlug);
router.post('/comercios', MarketplaceController.createComercio);
router.put('/comercios/:id', MarketplaceController.updateComercio);

router.get('/productos', MarketplaceController.listProductos);
router.get('/productos/:id', MarketplaceController.getProducto);
router.post('/productos', MarketplaceController.createProducto);
router.put('/productos/:id', MarketplaceController.updateProducto);

router.post('/seed', MarketplaceController.seedDemo);

export default router;
