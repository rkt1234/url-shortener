const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');
const generateShortCode = require('../utils/shortCode');

const prisma = new PrismaClient();

exports.shortenUrl = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { originalUrl, customCode, expiresAt } = req.body;
    const userId = req.user.userId;

    let shortCode = customCode || generateShortCode();

    try {
        // Ensure uniqueness
        const exists = await prisma.url.findUnique({ where: { shortCode } });
        if (exists) return res.status(409).json({ message: 'Short code already in use' });

        const url = await prisma.url.create({
            data: {
                originalUrl,
                shortCode,
                userId,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
            },
        });

        res.status(201).json({
            shortUrl: `${req.protocol}://${req.get('host')}/${url.shortCode}`,
            ...url,
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to shorten URL' });
    }
};

exports.redirectToOriginal = async (req, res) => {
    const { shortCode } = req.params;

    try {
        const url = await prisma.url.findUnique({ where: { shortCode } });
        if (!url) return res.status(404).json({ message: 'URL not found' });

        if (url.expiresAt && new Date(url.expiresAt) < new Date())
            return res.status(410).json({ message: 'URL has expired' });

        await prisma.url.update({
            where: { shortCode },
            data: { clickCount: { increment: 1 } },
        });

        const userAgent = req.get('User-Agent') || 'unknown';
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        await prisma.click.create({
            data: {
                urlId: url.id,
                ipAddress: ip,
                userAgent,
            },
        });

        res.redirect(url.originalUrl);
    } catch (err) {
        res.status(500).json({ error: 'Redirection failed' });
    }
};
