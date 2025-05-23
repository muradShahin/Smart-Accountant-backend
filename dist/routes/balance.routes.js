"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const balance_controller_1 = require("../controllers/balance.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
router.get('/', balance_controller_1.getCompanyBalance);
router.post('/', balance_controller_1.updateCompanyBalance);
exports.default = router;
