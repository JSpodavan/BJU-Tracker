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
apiRouter.post('/api/createDish', apiController.createDish);
apiRouter.get('/api/DishList/:id', apiController.loadDishList);
apiRouter.delete('/api/deleteDish', apiController.deleteDish);
apiRouter.post('/api/createMeal', apiController.createMeal);
apiRouter.post('/api/updateAbout', apiController.updateAbout);
apiRouter.get('/api/getUserProfile', apiController.getUserProfile);

export default apiRouter;
