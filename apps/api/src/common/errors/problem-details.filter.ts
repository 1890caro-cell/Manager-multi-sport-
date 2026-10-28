import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { DomainError } from './domain-error.js';
import { ProblemDetails } from '@sports/contracts';

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let title = 'Lỗi máy chủ nội bộ';
    let detail: string | undefined = undefined;
    let details: Record<string, unknown> | undefined = undefined;

    if (exception instanceof DomainError) {
      status = exception.httpStatus;
      code = exception.code;
      title = exception.message;
      detail = exception.message;
      details = exception.details;
    } else if (exception instanceof ZodError || (exception as any)?.name === 'ZodError') {
      const zodErr = exception as ZodError;
      status = HttpStatus.BAD_REQUEST;
      code = 'VALIDATION_ERROR';
      const issues = zodErr.issues || zodErr.errors || [];
      const firstIssue = issues[0];
      title = firstIssue?.message || 'Dữ liệu yêu cầu không hợp lệ';
      detail = issues.map((e) => `${e.path.join('.') || 'body'}: ${e.message}`).join('; ');
      details = {
        issues,
      };
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        title = exceptionResponse;
        detail = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const respObj = exceptionResponse as Record<string, unknown>;
        title = (respObj['error'] as string) || exception.message;
        detail = Array.isArray(respObj['message'])
          ? (respObj['message'] as string[]).join('; ')
          : (respObj['message'] as string) || exception.message;
        code = (respObj['code'] as string) || this.mapStatusToCode(status);
        if (respObj['details']) {
          details = respObj['details'] as Record<string, unknown>;
        }
      }
    } else {
      // Lỗi hệ thống không lường trước
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}:`,
        exception instanceof Error ? exception.stack : exception,
      );
      title = 'Đã có lỗi xảy ra trên hệ thống';
      detail = 'Vui lòng thử lại sau hoặc liên hệ quản trị viên.';
    }

    const problem: ProblemDetails = {
      type: 'about:blank',
      title,
      status,
      code,
      detail,
      instance: request.url,
      ...(details ? { details } : {}),
    };

    response.status(status).contentType('application/problem+json').json(problem);
  }

  private mapStatusToCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'UNPROCESSABLE_ENTITY';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'TOO_MANY_REQUESTS';
      default:
        return 'HTTP_ERROR';
    }
  }
}
