import { HttpResponse } from "./response";
import { HTTPException } from "hono/http-exception";
import { StatusCodes as HttpStatus } from "http-status-codes";

export class BadRequestException<T> extends HTTPException {
  constructor(message: string, data: T | null = null) {
    super(HttpStatus.BAD_REQUEST, {
      res: new Response(JSON.stringify(new HttpResponse(message, data)), {
        status: HttpStatus.BAD_REQUEST,
        headers: { "Content-Type": "application/json" },
      }),
    });
  }
}

export class NotFoundException<T> extends HTTPException {
  constructor(message: string, data: T | null = null) {
    super(HttpStatus.NOT_FOUND, {
      res: new Response(JSON.stringify(new HttpResponse(message, data)), {
        status: HttpStatus.NOT_FOUND,
        headers: { "Content-Type": "application/json" },
      }),
    });
  }
}

export class PreconditionFailedException<T> extends HTTPException {
  constructor(message: string, data: T | null = null) {
    super(HttpStatus.PRECONDITION_FAILED, {
      res: new Response(JSON.stringify(new HttpResponse(message, data)), {
        status: HttpStatus.PRECONDITION_FAILED,
        headers: { "Content-Type": "application/json" },
      }),
    });
  }
}
