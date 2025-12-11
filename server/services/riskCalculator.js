/**
 * Risk Calculator Service
 * Calculates project risk based on multiple factors
 */

class RiskCalculator {
  calculateRisk(project) {
    let riskScore = 0;
    const factors = [];
    const recommendations = [];

    // Factor 1: Budget Overrun (0-40 points)
    const budgetUsagePercent = (parseFloat(project.spent) / parseFloat(project.budget)) * 100;
    const progressPercent = parseFloat(project.actual_progress);

    if (budgetUsagePercent > progressPercent + 30) {
      riskScore += 40;
      factors.push({
        factor: 'Critical Budget Overrun',
        score: 40,
        description: `Spent ${budgetUsagePercent.toFixed(1)}% of budget with only ${progressPercent}% progress`
      });
      recommendations.push('Immediate budget review required');
      recommendations.push('Consider scope reduction or additional funding');
    } else if (budgetUsagePercent > progressPercent + 20) {
      riskScore += 30;
      factors.push({
        factor: 'High Budget Usage',
        score: 30,
        description: `Budget usage (${budgetUsagePercent.toFixed(1)}%) exceeds progress (${progressPercent}%)`
      });
      recommendations.push('Monitor spending closely');
    } else if (budgetUsagePercent > progressPercent + 10) {
      riskScore += 15;
      factors.push({
        factor: 'Moderate Budget Concern',
        score: 15,
        description: 'Budget usage slightly ahead of progress'
      });
    }

    // Factor 2: Schedule Delay (0-30 points)
    const plannedProgress = parseFloat(project.planned_progress);
    const scheduleDeviation = plannedProgress - progressPercent;

    if (scheduleDeviation > 20) {
      riskScore += 30;
      factors.push({
        factor: 'Severe Schedule Delay',
        score: 30,
        description: `Project is ${scheduleDeviation.toFixed(1)}% behind schedule`
      });
      recommendations.push('Increase resources or adjust timeline');
    } else if (scheduleDeviation > 10) {
      riskScore += 20;
      factors.push({
        factor: 'Schedule Delay',
        score: 20,
        description: `Behind schedule by ${scheduleDeviation.toFixed(1)}%`
      });
      recommendations.push('Review project timeline and milestones');
    } else if (scheduleDeviation > 5) {
      riskScore += 10;
      factors.push({
        factor: 'Minor Schedule Concern',
        score: 10,
        description: 'Slightly behind schedule'
      });
    }

    // Factor 3: Overdue Invoices (0-20 points)
    const overdueInvoices = parseInt(project.overdue_invoices || 0);
    
    if (overdueInvoices > 5) {
      riskScore += 20;
      factors.push({
        factor: 'Multiple Overdue Invoices',
        score: 20,
        description: `${overdueInvoices} overdue invoices`
      });
      recommendations.push('Address payment collection urgently');
    } else if (overdueInvoices > 2) {
      riskScore += 15;
      factors.push({
        factor: 'Overdue Invoices',
        score: 15,
        description: `${overdueInvoices} overdue invoices`
      });
      recommendations.push('Follow up on outstanding payments');
    } else if (overdueInvoices > 0) {
      riskScore += 5;
      factors.push({
        factor: 'Some Overdue Invoices',
        score: 5,
        description: `${overdueInvoices} overdue invoice(s)`
      });
    }

    // Factor 4: Project Status (0-10 points)
    if (project.status === 'On Hold') {
      riskScore += 10;
      factors.push({
        factor: 'Project On Hold',
        score: 10,
        description: 'Project is currently on hold'
      });
      recommendations.push('Resume project or update status');
    }

    // Determine risk level
    let riskLevel;
    if (riskScore >= 70) {
      riskLevel = 'Critical';
    } else if (riskScore >= 50) {
      riskLevel = 'High';
    } else if (riskScore >= 30) {
      riskLevel = 'Medium';
    } else {
      riskLevel = 'Low';
    }

    // Add general recommendations if no specific ones
    if (recommendations.length === 0) {
      recommendations.push('Project is on track');
      recommendations.push('Continue monitoring key metrics');
    }

    return {
      risk_score: Math.min(100, riskScore),
      risk_level: riskLevel,
      factors,
      recommendations
    };
  }

  // Batch calculate risk for multiple projects
  calculateBatchRisk(projects) {
    return projects.map(project => ({
      project_id: project.id,
      project_name: project.project_name,
      ...this.calculateRisk(project)
    }));
  }
}

module.exports = new RiskCalculator();