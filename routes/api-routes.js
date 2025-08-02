import express from 'express';
import apiController from '../controller/api-controller.js';
const Router = express.Router;
const apiRouter = new Router();
import { check, validationResult } from 'express-validator';

apiRouter.post('/api/search', apiController.search);
apiRouter.get('/api/loadHistory', apiController.loadHistory);
apiRouter.post('/api/favourite', apiController.addFavourite);
apiRouter.get('/api/loadFavourite', apiController.loadFavourite);
apiRouter.delete('/api/deleteFavourite', apiController.deleteFavourite);

export default apiRouter;
