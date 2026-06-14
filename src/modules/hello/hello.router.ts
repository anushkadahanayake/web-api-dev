import { Router } from 'express';
import { HelloController } from './hello.controller.js';

const router = Router();
const controller = new HelloController();

router.get('/express', controller.getExpressHello);
router.get('/node', controller.getNodeHello);

export { router as helloRouter };
