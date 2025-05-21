const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');
const generateShortCode = require('../utils/shortCode');
const redis = require('../utils/redisClient');
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
    console.log("yahi wala h")
    const { shortCode } = req.params;
    console.log(shortCode);
    try {
      // Try Redis first
      const cached = await redis.get(shortCode);
      if (cached) {
        await prisma.url.update({ where: { shortCode }, data: { clickCount: { increment: 1 } } });
        await prisma.click.create({
          data: {
            urlId: JSON.parse(cached).id,
            ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            userAgent: req.get('User-Agent') || 'unknown',
          },
        });
        return res.redirect(JSON.parse(cached).originalUrl);
      }
  
      // Fallback to DB
      const url = await prisma.url.findUnique({ where: { shortCode } });
      if (!url) return res.status(404).json({ message: 'URL not found' });
  
      if (url.expiresAt && new Date(url.expiresAt) < new Date())
        return res.status(410).json({ message: 'URL expired' });
  
      await redis.setEx(shortCode, 60 * 60, JSON.stringify({ id: url.id, originalUrl: url.originalUrl }));
  
      await prisma.url.update({ where: { shortCode }, data: { clickCount: { increment: 1 } } });
  
      await prisma.click.create({
        data: {
          urlId: url.id,
          ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          userAgent: req.get('User-Agent') || 'unknown',
        },
      });
  
      res.redirect(url.originalUrl);
    } catch (err) {
      res.status(500).json({ error: 'Redirection failed' });
    }
  };

exports.getUserUrls = async (req, res) => {
    const { userId } = req.user;
    const { status } = req.query; // "active" or "expired"

    const now = new Date();

    const whereClause = {
        userId,
        ...(status === 'active' && { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }),
        ...(status === 'expired' && { expiresAt: { lt: now } }),
    };

    try {
        const urls = await prisma.url.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
        });
        res.json(urls);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch URLs' });
    }
};

exports.getUrlById = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
        const url = await prisma.url.findUnique({ where: { id } });
        if (!url || url.userId !== userId) return res.status(404).json({ message: 'URL not found' });
        res.json(url);
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve URL' });
    }
};

exports.updateUrl = async (req, res) => {
    const { id } = req.params;
    const { originalUrl, expiresAt } = req.body;
    const userId = req.user.userId;

    try {
        const url = await prisma.url.findUnique({ where: { id } });
        if (!url || url.userId !== userId) return res.status(404).json({ message: 'URL not found' });

        const updated = await prisma.url.update({
            where: { id },
            data: {
                ...(originalUrl && { originalUrl }),
                ...(expiresAt && { expiresAt: new Date(expiresAt) }),
            },
        });

        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update URL' });
    }
};

exports.deleteUrl = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
        const url = await prisma.url.findUnique({ where: { id } });
        if (!url || url.userId !== userId) return res.status(404).json({ message: 'URL not found' });

        await prisma.url.delete({ where: { id } });
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete URL' });
    }
};

