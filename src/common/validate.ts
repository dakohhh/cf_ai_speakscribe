import { zValidator } from "@hono/zod-validator";
import type { ValidationTargets } from "hono";
import { ZodType } from "zod";
import { BadRequestException } from "./exception";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const validate = <T extends ZodType, Target extends keyof ValidationTargets>(target: Target, schema: T) =>
  zValidator(target, schema, (result) => {
    if (!result.success) {
      throw new BadRequestException("Validation failed", result.error.issues);
    }
  });
