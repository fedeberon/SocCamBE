import { Router } from 'express';
import multer from 'multer';
import MarketplaceController from '../controllers/marketplace.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/comercios', MarketplaceController.listComercios);
router.get('/comercios/:slug', MarketplaceController.getComercioBySlug);
router.post('/comercios', MarketplaceController.createComercio);
router.put('/comercios/:id', MarketplaceController.updateComercio);
router.delete('/comercios/:id', MarketplaceController.deleteComercio);

router.get('/admin/comercios', MarketplaceController.listComerciosAdmin);
router.get('/admin/emprendedores', MarketplaceController.listEmprendedoresAdmin);
router.post('/admin/emprendedores/:comercioId/reset-password', MarketplaceController.resetPasswordEmprendedorAdmin);
router.delete('/admin/emprendedores/:comercioId', MarketplaceController.deleteEmprendedorAdmin);

router.get('/productos', MarketplaceController.listProductos);
router.get('/productos/:id', MarketplaceController.getProducto);
router.post('/productos', MarketplaceController.createProducto);
router.put('/productos/:id', MarketplaceController.updateProducto);
router.delete('/productos/:id', MarketplaceController.deleteProducto);

router.get('/emprendedores', MarketplaceController.listEmprendedores);
router.post('/emprendedores/registro', MarketplaceController.registerEmprendedor);
router.post('/emprendedores/login', MarketplaceController.loginEmprendedor);
router.get('/emprendedores/mi-cuenta', MarketplaceController.getMiEmprendimiento);
router.put('/emprendedores/mi-cuenta', MarketplaceController.actualizarMiEmprendimiento);
router.post('/emprendedores/ia-sugerir', upload.single('image'), MarketplaceController.sugerirProductoIa);
router.post('/emprendedores/publicar-producto', MarketplaceController.publicarProductoEmprendedor);

router.post('/seed', MarketplaceController.seedDemo);

export default router;
