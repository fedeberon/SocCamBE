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

router.get('/emprendedores', MarketplaceController.listEmprendedores);
router.post('/emprendedores/registro', MarketplaceController.registerEmprendedor);
router.post('/emprendedores/login', MarketplaceController.loginEmprendedor);
router.get('/emprendedores/mi-cuenta', MarketplaceController.getMiEmprendimiento);
router.put('/emprendedores/mi-cuenta', MarketplaceController.actualizarMiEmprendimiento);
router.post('/emprendedores/ia-sugerir', MarketplaceController.sugerirProductoIa);
router.post('/emprendedores/publicar-producto', MarketplaceController.publicarProductoEmprendedor);

router.post('/seed', MarketplaceController.seedDemo);

export default router;
