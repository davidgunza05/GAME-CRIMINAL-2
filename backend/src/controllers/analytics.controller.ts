import { Request, Response } from 'express'
import * as analyticsService from '../services/analytics.service'
import { sendSuccess } from '../utils/response'

export const getFullAnalytics = async (req: Request, res: Response): Promise<void> => {
  const { days = 30 } = req.query as any
  const data = await analyticsService.getFullAnalytics(Number(days))
  sendSuccess(res, data)
}

export const getOverviewKPIs = async (_req: Request, res: Response): Promise<void> => {
  const data = await analyticsService.getOverviewKPIs()
  sendSuccess(res, data)
}

export const getRevenueChart = async (req: Request, res: Response): Promise<void> => {
  const { days = 30 } = req.query as any
  const data = await analyticsService.getRevenueChart(Number(days))
  sendSuccess(res, { chart: data })
}

export const getUserGrowth = async (req: Request, res: Response): Promise<void> => {
  const { days = 30 } = req.query as any
  const data = await analyticsService.getUserGrowthChart(Number(days))
  sendSuccess(res, { chart: data })
}

export const getSessionsChart = async (req: Request, res: Response): Promise<void> => {
  const { days = 30 } = req.query as any
  const data = await analyticsService.getSessionsChart(Number(days))
  sendSuccess(res, { chart: data })
}

export const getActivityFeed = async (_req: Request, res: Response): Promise<void> => {
  const data = await analyticsService.getActivityFeed()
  sendSuccess(res, { feed: data })
}

export const getTopCases = async (_req: Request, res: Response): Promise<void> => {
  const data = await analyticsService.getTopCasesByRevenue()
  sendSuccess(res, { topCases: data })
}

export const getDropOff = async (_req: Request, res: Response): Promise<void> => {
  const data = await analyticsService.getDropOffStats()
  sendSuccess(res, { dropOff: data })
}

export const getRetention = async (_req: Request, res: Response): Promise<void> => {
  const data = await analyticsService.getPlayerRetention()
  sendSuccess(res, { retention: data })
}
