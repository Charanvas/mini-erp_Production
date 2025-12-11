/**
 * Cash Flow Forecaster Service
 * Simple formula-based cash flow forecasting
 */

class CashFlowForecaster {
  forecast(historicalData, forecastMonths = 3) {
    if (!historicalData || historicalData.length < 3) {
      return {
        forecast: [],
        average_inflow: 0,
        average_outflow: 0,
        average_net_flow: 0,
        error: 'Insufficient historical data (minimum 3 months required)'
      };
    }

    // Calculate averages and trends
    const stats = this.calculateStatistics(historicalData);
    
    // Generate forecast
    const forecast = [];
    let lastMonth = new Date(historicalData[0].month);

    for (let i = 1; i <= forecastMonths; i++) {
      // Add one month
      lastMonth = new Date(lastMonth.setMonth(lastMonth.getMonth() + 1));
      const forecastMonth = lastMonth.toISOString().slice(0, 7);

      // Apply trend to average
      const projectedInflow = stats.average_inflow * (1 + stats.inflow_trend * i);
      const projectedOutflow = stats.average_outflow * (1 + stats.outflow_trend * i);
      const projectedNetFlow = projectedInflow - projectedOutflow;

      forecast.push({
        month: forecastMonth,
        projected_inflow: parseFloat(projectedInflow.toFixed(2)),
        projected_outflow: parseFloat(projectedOutflow.toFixed(2)),
        projected_net_flow: parseFloat(projectedNetFlow.toFixed(2)),
        confidence: this.calculateConfidence(historicalData.length, i)
      });
    }

    return {
      forecast,
      average_inflow: stats.average_inflow,
      average_outflow: stats.average_outflow,
      average_net_flow: stats.average_net_flow,
      trends: {
        inflow_trend: (stats.inflow_trend * 100).toFixed(2) + '%',
        outflow_trend: (stats.outflow_trend * 100).toFixed(2) + '%'
      }
    };
  }

  calculateStatistics(data) {
    const n = data.length;
    
    // Calculate averages
    const totalInflow = data.reduce((sum, d) => sum + parseFloat(d.cash_inflow || 0), 0);
    const totalOutflow = data.reduce((sum, d) => sum + parseFloat(d.cash_outflow || 0), 0);
    
    const average_inflow = totalInflow / n;
    const average_outflow = totalOutflow / n;

    // Calculate simple linear trend
    // Using least squares method simplified
    let inflow_trend = 0;
    let outflow_trend = 0;

    if (n >= 3) {
      const oldestInflow = parseFloat(data[n - 1].cash_inflow || 0);
      const newestInflow = parseFloat(data[0].cash_inflow || 0);
      inflow_trend = (newestInflow - oldestInflow) / (oldestInflow || 1) / n;

      const oldestOutflow = parseFloat(data[n - 1].cash_outflow || 0);
      const newestOutflow = parseFloat(data[0].cash_outflow || 0);
      outflow_trend = (newestOutflow - oldestOutflow) / (oldestOutflow || 1) / n;
    }

    return {
      average_inflow,
      average_outflow,
      inflow_trend,
      outflow_trend
    };
  }

  calculateConfidence(historicalMonths, forecastMonth) {
    // Confidence decreases with forecast distance and increases with data
    const baseConfidence = Math.min(90, historicalMonths * 10);
    const decayFactor = forecastMonth * 10;
    return Math.max(40, baseConfidence - decayFactor) + '%';
  }

  // Scenario analysis
  generateScenarios(historicalData, forecastMonths = 3) {
    const baseForecast = this.forecast(historicalData, forecastMonths);
    
    if (baseForecast.error) {
      return { error: baseForecast.error };
    }

    // Optimistic scenario (+20%)
    const optimistic = baseForecast.forecast.map(f => ({
      ...f,
      projected_inflow: parseFloat((f.projected_inflow * 1.2).toFixed(2)),
      projected_outflow: parseFloat((f.projected_outflow * 0.9).toFixed(2)),
      projected_net_flow: parseFloat((f.projected_inflow * 1.2 - f.projected_outflow * 0.9).toFixed(2))
    }));

    // Pessimistic scenario (-20%)
    const pessimistic = baseForecast.forecast.map(f => ({
      ...f,
      projected_inflow: parseFloat((f.projected_inflow * 0.8).toFixed(2)),
      projected_outflow: parseFloat((f.projected_outflow * 1.1).toFixed(2)),
      projected_net_flow: parseFloat((f.projected_inflow * 0.8 - f.projected_outflow * 1.1).toFixed(2))
    }));

    return {
      base: baseForecast.forecast,
      optimistic,
      pessimistic
    };
  }
}

module.exports = new CashFlowForecaster();