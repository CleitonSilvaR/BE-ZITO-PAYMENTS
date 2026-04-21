import { Request, Response, NextFunction } from 'express';
import { findActiveGatewayConfig, findProjectByApiKey } from '../projects/project.service';
import { GatewayConfig, Project } from '../payments/payment.types';

declare global {
  namespace Express {
    interface Request {
      project: Project;
      gatewayConfig: GatewayConfig;
    }
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const apiKey = req.headers['x-api-key'] as string | undefined;

  if (!apiKey) {
    res.status(401).json({ error: 'Missing x-api-key header' });
    return;
  }

  const project = await findProjectByApiKey(apiKey);
  if (!project) {
    res.status(401).json({ error: 'Invalid API key' });
    return;
  }

  const gateway = (req.body?.gateway as string | undefined) ?? undefined;
  const gatewayConfig = await findActiveGatewayConfig(project.id, gateway);
  if (!gatewayConfig) {
    res.status(401).json({ error: 'No active gateway config for this project' });
    return;
  }

  req.project = project;
  req.gatewayConfig = gatewayConfig;
  next();
}
