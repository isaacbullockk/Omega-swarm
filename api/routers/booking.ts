import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import * as store from "../../db/store";

export const bookingRouter = router({
  /* ─── Services ─── */
  services: publicProcedure.query(() => {
    return store.getServices();
  }),

  service: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      return store.getService(input.id);
    }),

  /* ─── Bookings ─── */
  list: publicProcedure.query(() => {
    return store.getBookings();
  }),

  myBookings: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(({ input }) => {
      return store.getBookingsByEmail(input.email);
    }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      return store.getBooking(input.id);
    }),

  create: publicProcedure
    .input(
      z.object({
        clientName: z.string().min(1),
        clientEmail: z.string().email(),
        clientCompany: z.string().optional(),
        serviceId: z.string(),
        date: z.string(),
        time: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(({ input }) => {
      const service = store.getService(input.serviceId);
      if (!service) throw new Error("Service not found");

      const booking: store.Booking = {
        id: `bk_${Date.now()}`,
        clientName: input.clientName,
        clientEmail: input.clientEmail,
        clientCompany: input.clientCompany,
        serviceId: input.serviceId,
        serviceName: service.name,
        date: input.date,
        time: input.time,
        status: "pending",
        notes: input.notes,
        createdAt: new Date().toISOString(),
      };

      return store.addBooking(booking);
    }),

  updateStatus: publicProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["pending", "confirmed", "completed", "cancelled"]),
      })
    )
    .mutation(({ input }) => {
      return store.updateBookingStatus(input.id, input.status);
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      return store.deleteBooking(input.id);
    }),
});
