import { DataService } from "../services/dataService.js";

export const patientProgressReport = async (req, res, next) => {
  try {
    const patientId = req.params.patientId;
    const charts = await DataService.listCharts(patientId);

    const grouped = charts.reduce((acc, item) => {
      if (!acc[item.metric]) {
        acc[item.metric] = [];
      }
      acc[item.metric].push(Number(item.value));
      return acc;
    }, {});

    const trends = Object.entries(grouped).map(([metric, values]) => {
      const average = values.reduce((sum, value) => sum + value, 0) / values.length;
      return {
        metric,
        samples: values.length,
        average: Number(average.toFixed(2)),
        min: Math.min(...values),
        max: Math.max(...values)
      };
    });

    return res.json({
      id: patientId,
      patientId,
      totalEntries: charts.length,
      trends
    });
  } catch (err) {
    return next(err);
  }
};
