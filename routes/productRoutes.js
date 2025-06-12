const express = require('express');
const mongoose = require('mongoose');
const Product = require('../models/Product');

const router = express.Router();

// GET /api/products - with search, sort, and pagination
router.get('/', async (req, res) => {
    try {
        let { page = 1, limit = 10, sortBy = 'createdAt', order = 'asc', search } = req.query;

        page = parseInt(page);
        limit = parseInt(limit);
        const sortOrder = order.toLowerCase() === 'desc' ? -1 : 1;
        const sortOptions = { [sortBy]: sortOrder };
        const filter = search ? { name: { $regex: search, $options: 'i' } } : {};

        const total = await Product.countDocuments(filter);
        const products = await Product.find(filter)
            .sort(sortOptions)
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({
            total,
            page,
            totalPages: Math.ceil(total / limit),
            limit,
            products
        });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
});

// GET /api/products/:id - Get one product
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid product ID' });
        }

        const product = await Product.findById(id);
        product
            ? res.json(product)
            : res.status(404).json({ message: 'Product not found' });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
});

// POST /api/products - Create a new product
router.post('/', async (req, res) => {
    try {
        const { name, price, description, category, inStock } = req.body;

        if (!name || isNaN(price)) {
            return res.status(400).json({ message: 'Valid name and price are required' });
        }

        const newProduct = new Product({ name, price, description, category, inStock });
        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
});

// PUT /api/products/:id - Update product
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid product ID' });
        }

        const updatedProduct = await Product.findByIdAndUpdate(id, req.body, { new: true });
        updatedProduct
            ? res.json(updatedProduct)
            : res.status(404).json({ message: 'Product not found' });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
});

// DELETE /api/products/:id - Delete product
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid product ID' });
        }

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        await Product.findByIdAndDelete(id);
        res.json({ message: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
});

module.exports = router;