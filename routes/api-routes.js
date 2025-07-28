import express from 'express';
import apiController from '../controller/api-controller.js';
const Router = express.Router;
const apiRouter = new Router();
import { check, validationResult } from 'express-validator';

apiRouter.post('/api/search', apiController.search);

export default apiRouter;
