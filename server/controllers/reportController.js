const Ticket = require('../models/Ticket');
const Asset = require('../models/Asset');

const groupByField = async (Model, field) => Model.aggregate([
  { $group: { _id: `$${field}`, count: { $sum: 1 } } },
  { $sort: { count: -1 } },
]);

const getReports = async (req, res) => {
  try {
    const [
      ticketTotal,
      openTickets,
      resolvedTickets,
      criticalTickets,
      assetTotal,
      assetsInMaintenance,
      ticketsByStatus,
      ticketsByPriority,
      ticketsByCategory,
      assetsByStatus,
      recentTickets,
    ] = await Promise.all([
      Ticket.countDocuments(),
      Ticket.countDocuments({ status: { $in: ['open', 'in_progress', 'pending_user'] } }),
      Ticket.countDocuments({ status: { $in: ['resolved', 'closed'] } }),
      Ticket.countDocuments({ priority: 'critical', status: { $nin: ['closed', 'resolved'] } }),
      Asset.countDocuments(),
      Asset.countDocuments({ status: 'maintenance' }),
      groupByField(Ticket, 'status'),
      groupByField(Ticket, 'priority'),
      groupByField(Ticket, 'category'),
      groupByField(Asset, 'status'),
      Ticket.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const trendMap = new Map(recentTickets.map((item) => [item._id, item.count]));
    const ticketTrend = Array.from({ length: 30 }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (29 - index));
      const key = date.toISOString().slice(0, 10);
      return { date: key.slice(5), tickets: trendMap.get(key) || 0 };
    });

    res.json({
      summary: { ticketTotal, openTickets, resolvedTickets, criticalTickets, assetTotal, assetsInMaintenance },
      tickets: {
        byStatus: ticketsByStatus.map(({ _id, count }) => ({ name: _id, value: count })),
        byPriority: ticketsByPriority.map(({ _id, count }) => ({ name: _id, value: count })),
        byCategory: ticketsByCategory.map(({ _id, count }) => ({ name: _id, value: count })),
        trend: ticketTrend,
      },
      assets: { byStatus: assetsByStatus.map(({ _id, count }) => ({ name: _id, value: count })) },
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ message: 'Server error generating reports' });
  }
};

module.exports = { getReports };
