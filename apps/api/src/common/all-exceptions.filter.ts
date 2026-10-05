import type { ApiError } from '@kld/shared';
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ZodSerializationException, ZodValidationException } from 'nestjs-zod';
import { AppException } from './app.exception.js';

function toIssues(error: unknown) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'issues' in error &&
    Array.isArray(error.issues)
  ) {
    return (
      error.issues as Array<{ path: PropertyKey[]; message: string }>
    ).map((issue) => ({
      path: issue.path.map(String).join('.'),
      message: issue.message,
    }));
  }
  return undefined;
}

const internalError = (): ApiError => ({
  statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
  code: 'INTERNAL_ERROR',
  message: 'Internal server error',
});

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request & { id?: unknown }>();
    const response = ctx.getResponse<Response>();

    const body: ApiError = {
      ...this.toApiError(exception),
      requestId: request.id ? String(request.id) : undefined,
    };

    if (body.statusCode >= 500) {
      const issues =
        exception instanceof ZodSerializationException
          ? ` ${JSON.stringify(toIssues(exception.getZodError()))}`
          : '';
      this.logger.error(
        `${request.method} ${request.url} failed: ${
          exception instanceof Error ? exception.message : String(exception)
        }${issues}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(body.statusCode).json(body);
  }

  private toApiError(exception: unknown): ApiError {
    if (exception instanceof AppException) {
      return {
        statusCode: exception.getStatus(),
        code: exception.code,
        message: exception.message,
        details: exception.details,
      };
    }
    if (exception instanceof ZodValidationException) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'VALIDATION_FAILED',
        message: 'Request validation failed',
        details: toIssues(exception.getZodError()),
      };
    }
    if (exception instanceof ZodSerializationException) {
      return internalError();
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      if (status >= 500) return { ...internalError(), statusCode: status };
      return {
        statusCode: status,
        code:
          status === HttpStatus.NOT_FOUND
            ? 'NOT_FOUND'
            : status === HttpStatus.TOO_MANY_REQUESTS
              ? 'RATE_LIMITED'
              : 'HTTP_ERROR',
        message: exception.message,
      };
    }
    return internalError();
  }
}
