interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
  message?: string;
}

const ipStore = new Map<string, RateLimitEntry>();
const userStore = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL = 5 * 60 * 1000;

let cleanupInitialized = false;

function initCleanup() {
  if (cleanupInitialized) return;
  cleanupInitialized = true;
  
  setInterval(() => {
    const now = Date.now();
    
    for (const [key, entry] of ipStore.entries()) {
      if (now > entry.resetTime) {
        ipStore.delete(key);
      }
    }
    
    for (const [key, entry] of userStore.entries()) {
      if (now > entry.resetTime) {
        userStore.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  return '127.0.0.1';
}

function checkRateLimit(
  store: Map<string, RateLimitEntry>,
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetIn: number } {
  initCleanup();
  
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const entry = store.get(key);
  
  if (!entry || now > entry.resetTime) {
    store.set(key, {
      count: 1,
      resetTime: now + windowMs
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowSeconds
    };
  }
  
  entry.count++;
  
  const remaining = Math.max(0, config.maxRequests - entry.count);
  const resetIn = Math.ceil((entry.resetTime - now) / 1000);
  
  if (entry.count > config.maxRequests) {
    return { allowed: false, remaining: 0, resetIn };
  }
  
  return { allowed: true, remaining, resetIn };
}

export function rateLimitByIP(request: Request, config: RateLimitConfig) {
  const ip = getClientIP(request);
  return {
    ...checkRateLimit(ipStore, ip, config),
    identifier: ip
  };
}

export function rateLimitByUser(userId: string, config: RateLimitConfig) {
  return {
    ...checkRateLimit(userStore, userId, config),
    identifier: userId
  };
}

export function rateLimitCombined(
  request: Request,
  userId: string | null,
  ipConfig: RateLimitConfig,
  userConfig?: RateLimitConfig
) {
  const ipResult = rateLimitByIP(request, ipConfig);
  
  if (!ipResult.allowed) {
    return {
      allowed: false,
      reason: 'ip' as const,
      remaining: ipResult.remaining,
      resetIn: ipResult.resetIn,
      identifier: ipResult.identifier
    };
  }
  
  if (userId && userConfig) {
    const userResult = rateLimitByUser(userId, userConfig);
    if (!userResult.allowed) {
      return {
        allowed: false,
        reason: 'user' as const,
        remaining: userResult.remaining,
        resetIn: userResult.resetIn,
        identifier: userResult.identifier
      };
    }
    return {
      allowed: true,
      reason: null,
      remaining: Math.min(ipResult.remaining, userResult.remaining),
      resetIn: Math.max(ipResult.resetIn, userResult.resetIn),
      identifier: userId
    };
  }
  
  return {
    allowed: true,
    reason: null,
    remaining: ipResult.remaining,
    resetIn: ipResult.resetIn,
    identifier: ipResult.identifier
  };
}

export const RATE_LIMITS = {
  PUBLIC_AUTH: {
    maxRequests: 5,
    windowSeconds: 60,
    message: "Trop de tentatives. Veuillez réessayer dans une minute."
  },
  
  SENSITIVE: {
    maxRequests: 3,
    windowSeconds: 60,
    message: "Trop de demandes d'envoi. Veuillez patienter."
  },
  
  AUTHENTICATED: {
    maxRequests: 30,
    windowSeconds: 60,
    message: "Trop de requêtes. Veuillez ralentir."
  },
  
  SEARCH: {
    maxRequests: 20,
    windowSeconds: 60,
    message: "Trop de recherches. Veuillez patienter."
  },
  
  UPLOAD: {
    maxRequests: 10,
    windowSeconds: 60,
    message: "Trop d'uploads. Veuillez patienter."
  }
} as const;

export function createRateLimitResponse(
  config: RateLimitConfig,
  resetIn: number
) {
  return new Response(
    JSON.stringify({
      success: false,
      error: 'rate_limit_exceeded',
      message: config.message || "Trop de requêtes. Veuillez réessayer plus tard.",
      retryAfter: resetIn
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(resetIn),
        'X-RateLimit-Reset': String(resetIn)
      }
    }
  );
}

export function withRateLimit(
  config: RateLimitConfig,
  handler: (request: Request) => Promise<Response>
) {
  return async (request: Request): Promise<Response> => {
    const result = rateLimitByIP(request, config);
    
    if (!result.allowed) {
      return createRateLimitResponse(config, result.resetIn);
    }
    
    const response = await handler(request);
    
    const newHeaders = new Headers(response.headers);
    newHeaders.set('X-RateLimit-Remaining', String(result.remaining));
    newHeaders.set('X-RateLimit-Reset', String(result.resetIn));
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  };
}
