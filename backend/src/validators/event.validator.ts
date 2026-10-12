
import { z } from "zod";

const externalVenueFields = {
  externalVenue: z
    .string()
    .trim()
    .min(1, "External venue name cannot be empty")
    .optional()
    .nullable(),

  venueAddress: z
    .string()
    .trim()
    .min(1, "External venue address cannot be empty")
    .optional()
    .nullable()
};

export const createEventSchema = z
  .object({
    creatorType: z.enum(["COLLEGE", "CLUB"]),

    venueId: z.string().uuid().optional().nullable(),

    ...externalVenueFields,

    title: z
      .string()
      .trim()
      .min(3, "Event title must be at least 3 characters")
      .max(150, "Event title must be at most 150 characters"),

    description: z
      .string()
      .trim()
      .max(5000, "Description must be at most 5000 characters")
      .optional()
      .nullable(),

    startTime: z.iso.datetime({ offset: true }),
    endTime: z.iso.datetime({ offset: true }),

    capacity: z.number().int().positive().optional().nullable(),

    visibility: z.enum(["COLLEGE_ONLY", "OPEN"]).default("COLLEGE_ONLY"),

    isPaid: z.boolean(),

    price: z.number().positive().optional().nullable()
  })
  .strict()
  .refine(
    (data) => new Date(data.endTime) > new Date(data.startTime),
    {
      message: "End time must be after start time",
      path: ["endTime"]
    }
  )
  .refine(
    (data) => {
      if (data.venueId) {
        return !data.externalVenue && !data.venueAddress;
      }

      return (
        (!data.externalVenue && !data.venueAddress) ||
        (Boolean(data.externalVenue) && Boolean(data.venueAddress))
      );
    },
    {
      message:
        "Choose a registered venue or provide both external venue name and address",
      path: ["venueAddress"]
    }
  )
  .refine(
    (data) => {
      if (data.isPaid) {
        return data.price != null && data.price > 0;
      }

      return data.price == null;
    },
    {
      message:
        "Paid events require a positive price; free events must not have a price",
      path: ["price"]
    }
  );

export const updateEventSchema = z
  .object({
    venueId: z.string().uuid().optional().nullable(),

    ...externalVenueFields,

    title: z
      .string()
      .trim()
      .min(3, "Event title must be at least 3 characters")
      .max(150, "Event title must be at most 150 characters")
      .optional(),

    description: z
      .string()
      .trim()
      .max(5000, "Description must be at most 5000 characters")
      .optional()
      .nullable(),

    startTime: z.iso.datetime({ offset: true }).optional(),
    endTime: z.iso.datetime({ offset: true }).optional(),

    capacity: z.number().int().positive().optional().nullable(),

    visibility: z.enum(["COLLEGE_ONLY", "OPEN"]).optional()
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided"
  });
