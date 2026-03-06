import { Router } from 'express';
import { FinanceController } from '../controllers/finance.controller';
import { authenticate } from '../middlewares/authenticate';

const router = Router();
router.use(authenticate);

// Fee types
router.get('/fee-types', FinanceController.getFeeTypes);
router.post('/fee-types', FinanceController.createFeeType);

// Fees
router.get('/fees', FinanceController.getFees);
router.post('/fees', FinanceController.createFee);
router.delete('/fees/:id', FinanceController.deleteFee);

// Payments
router.get('/payments', FinanceController.getPayments);
router.post('/payments', FinanceController.createPayment);
router.delete('/payments/:id', FinanceController.deletePayment);

// Stats & Soldes
router.get('/stats', FinanceController.getStats);
router.get('/student-balance', FinanceController.getStudentBalance);
router.get('/class-balance', FinanceController.getClassBalance);

export default router;