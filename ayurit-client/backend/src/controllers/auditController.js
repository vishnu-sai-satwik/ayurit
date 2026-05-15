import { PlatformService } from "../services/platformService.js";

export const listAuditLogs = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit || 200);
    const result = await PlatformService.listAuditLogs(limit, req.query);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};
