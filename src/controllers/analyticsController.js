const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { subDays } = require('date-fns');

exports.getUrlAnalytics = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const url = await prisma.url.findUnique({
      where: { id },
      include: { clicks: true },
    });

    if (!url || url.userId !== userId)
      return res.status(404).json({ message: 'URL not found' });

    const totalClicks = url.clicks.length;

    // Clicks in last 7 days
    const last7Days = await prisma.click.groupBy({
      by: ['timestamp'],
      where: {
        urlId: id,
        timestamp: { gte: subDays(new Date(), 7) },
      },
      _count: true,
    });

    const metadata = await prisma.click.findMany({
      where: { urlId: id },
      orderBy: { timestamp: 'desc' },
      take: 10,
    });

    res.json({
      totalClicks,
      last7Days: last7Days.map(c => ({
        date: c.timestamp.toISOString().slice(0, 10),
        count: c._count,
      })),
      recentClicks: metadata,
    });
  } catch (err) {
    res.status(500).json({ error: 'Analytics fetch failed' });
  }
};
